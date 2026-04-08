/**
 * YCK Agent - Web 服务端
 * Express API + SSE 流式推送
 */

import express from 'express';
import cors from 'cors';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { homedir } from 'os';
import { loadConfig, getConfig, switchProvider, switchModel } from '../core/config/index.js';
import { registerBuiltinTools, globalToolRegistry } from '../core/tools/index.js';
import { registerPresetAgents, coordinator } from '../core/agents/index.js';
import { chatEngine } from '../core/query/QueryEngine.js';
import { pluginManager } from '../core/plugins/index.js';
import { generateCompanion } from '../core/buddy/seed.js';
import type { Message } from '../types/message.js';
import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

const __dirname = dirname(fileURLToPath(import.meta.url));

// 初始化
loadConfig();
registerBuiltinTools();
registerPresetAgents();
pluginManager.loadAll();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 静态文件
app.use(express.static(resolve(__dirname, 'public')));

// 会话存储
interface SessionData {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
}

const SESSION_FILE = resolve(homedir(), '.ycka', 'sessions.json');
const sessions = new Map<string, SessionData>();

function loadSessions() {
  if (existsSync(SESSION_FILE)) {
    try {
      const data = JSON.parse(readFileSync(SESSION_FILE, 'utf-8'));
      for (const s of data) {
        sessions.set(s.id, s);
      }
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
  }
}

function saveSessions() {
  try {
    const dir = dirname(SESSION_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const data = Array.from(sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to save sessions:', e);
  }
}

// 启动时加载
loadSessions();

/** SSE 流式对话 */
app.post('/api/chat', async (req, res) => {
  const { message, sessionId = 'default', provider, model, images } = req.body;

  if (!message && (!images || images.length === 0)) {
    res.status(400).json({ error: '消息不能为空' });
    return;
  }

  // 临时切换 provider/model
  if (provider) {
    try { switchProvider(provider); chatEngine.resetClients(); } catch {}
  }
  if (model) {
    try { switchModel(model); } catch {}
  }

  // 每次请求都重建 client（确保使用最新的 key）
  chatEngine.resetClients();

  // 获取/创建会话
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      title: message.substring(0, 20) + (message.length > 20 ? '...' : ''),
      updatedAt: Date.now(),
      messages: [],
    });
  }
  const session = sessions.get(sessionId)!;
  session.updatedAt = Date.now();
  const history = session.messages;

  // 添加用户消息
  const userMsg: Message = { role: 'user', content: message, timestamp: Date.now() };
  if (images && Array.isArray(images) && images.length > 0) {
    (userMsg as any).images = images;
  }
  history.push(userMsg);
  saveSessions();

  // SSE 头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.flushHeaders();

  const config = getConfig();
  const currentProvider = config.activeProvider;
  const safeMessage = message || '';
  console.log(`  [chat] provider=${currentProvider} model=${config.activeModel} msg="${safeMessage.slice(0, 50)}"`);

  // 带超时的聊天请求
  async function tryChat(timeoutMs = 120000): Promise<string> {
    const abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), timeoutMs);

    let fullContent = '';
    try {
      for await (const event of chatEngine.chat(history, {
        systemPrompt: config.systemPrompt,
        tools: [],
        abortSignal: abortController.signal,
      })) {
        switch (event.type) {
          case 'text_delta':
            if (event.content) {
              fullContent += event.content;
              res.write(`data: ${JSON.stringify({ type: 'text', content: event.content })}\n\n`);
            }
            break;
          case 'tool_call_start':
            res.write(`data: ${JSON.stringify({ type: 'tool_start', name: event.toolCall?.name })}\n\n`);
            break;
          case 'tool_call_end':
            if (event.toolCall) {
              res.write(`data: ${JSON.stringify({ type: 'tool_end', name: event.toolCall.name, args: event.toolCall.arguments })}\n\n`);
            }
            break;
          case 'thinking_delta':
            if (event.content) {
              res.write(`data: ${JSON.stringify({ type: 'thinking', content: event.content })}\n\n`);
            }
            break;
          case 'done':
            res.write(`data: ${JSON.stringify({ type: 'done', usage: event.usage })}\n\n`);
            break;
          case 'error':
            throw new Error(event.error || 'Unknown error');
        }
      }
    } finally {
      clearTimeout(timer);
    }
    return fullContent;
  }

  try {
    const fullContent = await tryChat(120000);

    if (fullContent) {
      history.push({ role: 'assistant', content: fullContent, timestamp: Date.now() });
    } else {
      history.pop();

      // 自动 fallback 到 kimi
      if (currentProvider !== 'kimi' && config.providers.kimi?.apiKey) {
        console.log(`  [chat] ⚠️ ${currentProvider} 无响应，自动切换到 kimi`);
        res.write(`data: ${JSON.stringify({ type: 'text', content: `⚠️ ${currentProvider} 无响应（可能是网络问题），自动切换到 Kimi...\n\n` })}\n\n`);

        switchProvider('kimi');
        chatEngine.resetClients();
        history.push(userMsg); // 重新添加用户消息

        const fallbackContent = await tryChat(30000);
        if (fallbackContent) {
          history.push({ role: 'assistant', content: fallbackContent, timestamp: Date.now() });
        } else {
          history.pop();
          console.log('  [chat] ⚠️ kimi 也无响应');
        }
      } else {
        console.log('  [chat] ⚠️ 无响应内容');
      }
    }

  } catch (err: any) {
    const isTimeout = err.name === 'AbortError' || err.message?.includes('aborted');
    const isRateLimit = err.message?.includes('429') || err.message?.includes('rate');
    const shouldFallback = (isTimeout || isRateLimit || err.message?.includes('5')) && currentProvider !== 'kimi';
    console.error(`  [chat] ❌ ${isTimeout ? '超时' : isRateLimit ? '限流' : '错误'}:`, err.message);
    history.pop();

    if (shouldFallback && config.providers.kimi?.apiKey) {
      const reason = isTimeout ? '请求超时' : isRateLimit ? 'API 限流 (429)' : '服务异常';
      res.write(`data: ${JSON.stringify({ type: 'text', content: `⚠️ ${currentProvider} ${reason}，自动切换到 Kimi...\n\n` })}\n\n`);
      switchProvider('kimi');
      chatEngine.resetClients();
      history.push(userMsg);

      try {
        const fallbackContent = await tryChat(30000);
        if (fallbackContent) {
          history.push({ role: 'assistant', content: fallbackContent, timestamp: Date.now() });
        } else {
          history.pop();
        }
      } catch (e2: any) {
        history.pop();
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Kimi 也无法响应: ' + e2.message })}\n\n`);
      }
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();
});

/** 获取系统信息 */
app.get('/api/info', (_req, res) => {
  const cfg = getConfig();
  res.json({
    version: '1.0.0',
    activeProvider: cfg.activeProvider,
    activeModel: cfg.activeModel,
    tools: globalToolRegistry.size,
    agents: coordinator.getAllAgents().length,
    providers: Object.entries(cfg.providers).map(([name, p]) => ({
      name,
      hasKey: !!p.apiKey || (p.apiKeys && p.apiKeys.length > 0),
      model: p.models.default,
    })),
    toolList: globalToolRegistry.getAll().map(t => ({
      name: t.name,
      description: t.description,
      category: t.category,
    })),
    agentList: coordinator.getAllAgents().map(a => ({
      name: a.config.name,
      displayName: a.config.displayName,
      icon: a.config.icon,
      color: a.config.color,
    })),
  });
});

/** 获取历史会话列表 */
app.get('/api/sessions', (_req, res) => {
  const list = Array.from(sessions.values()).map(s => ({
    id: s.id,
    title: s.title,
    updatedAt: s.updatedAt,
  })).sort((a, b) => b.updatedAt - a.updatedAt);
  res.json(list);
});

/** 获取指定历史会话 */
app.get('/api/sessions/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (session) {
    res.json(session.messages);
  } else {
    res.json([]);
  }
});

/** 删除会话 */
app.delete('/api/sessions/:id', (req, res) => {
  sessions.delete(req.params.id);
  saveSessions();
  res.json({ ok: true });
});

/** 清空会话 (废弃，为兼容保留为清空单条) */
app.post('/api/clear', (req, res) => {
  const { sessionId = 'default' } = req.body || {};
  sessions.delete(sessionId);
  saveSessions();
  res.json({ ok: true });
});

/** 切换 Provider */
app.post('/api/provider', (req, res) => {
  try {
    switchProvider(req.body.provider);
    res.json({ ok: true, provider: req.body.provider });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/** 修改项目目录 Context */
app.post('/api/chdir', (req, res) => {
  try {
    const target = req.body.path;
    if (target && typeof target === 'string') {
      process.chdir(target);
      res.json({ ok: true, cwd: process.cwd() });
    } else {
      res.status(400).json({ error: 'invalid path' });
    }
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/** 递归获取文件系统树 */
function buildTree(dir: string, depth = 0, maxDepth = 2): any[] {
  if (depth > maxDepth) return [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    const blacklist = ['node_modules', '.git', 'dist', 'build', '.vscode', '.idea'];
    return entries
      .filter(e => !blacklist.includes(e.name) && !e.name.startsWith('.'))
      .map(e => {
        if (e.isDirectory()) {
          return { name: e.name, kind: 'directory', children: buildTree(join(dir, e.name), depth + 1, maxDepth) };
        }
        return { name: e.name, kind: 'file' };
      })
      .sort((a, b) => {
        if (a.kind === b.kind) return a.name.localeCompare(b.name);
        return a.kind === 'directory' ? -1 : 1;
      });
  } catch {
    return [];
  }
}

app.get('/api/tree', (_req, res) => {
  res.json({ cwd: process.cwd(), tree: buildTree(process.cwd()) });
});

/** ==== NEW FEATURE APIS ==== */

// Buddy Sprite API
app.get('/api/buddy/:userId', (req, res) => {
  try {
    const companion = generateCompanion(req.params.userId || 'Guest');
    res.json(companion);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Artifacts List API
app.get('/api/artifacts', (req, res) => {
  try {
    const artifactDir = resolve(homedir(), '.gemini', 'antigravity', 'brain');
    if (!existsSync(artifactDir)) return res.json([]);
    const convs = readdirSync(artifactDir, { withFileTypes: true });
    let artifacts: any[] = [];
    for (const conv of convs) {
      if (conv.isDirectory()) {
         try {
           const files = readdirSync(join(artifactDir, conv.name));
           const mdFiles = files.filter(f => f.endsWith('.md')).map(f => ({ name: f, path: join(artifactDir, conv.name, f), conv: conv.name }));
           artifacts.push(...mdFiles);
         } catch {}
      }
    }
    res.json(artifacts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// File system Search API (Actual feature)
app.post('/api/search', async (req, res) => {
  const { query, path = process.cwd() } = req.body;
  if (!query) return res.json([]);
  try {
    // Escape query simply and use powershell select-string
    const safeQuery = query.replace(/'/g, "''");
    const cmd = `powershell -Command "Get-ChildItem -Path '${path}' -Filter *.* -Recurse -File -ErrorAction SilentlyContinue | Select-String -Pattern '${safeQuery}' | Select-Object -First 50 | Select-Object Path, LineNumber, Line | ConvertTo-Json"`;
    const { stdout } = await execPromise(cmd);
    if (!stdout.trim()) return res.json([]);
    const results = JSON.parse(stdout);
    res.json(Array.isArray(results) ? results : [results]);
  } catch (err: any) {
    console.error("Search API Error:", err);
    res.json([]); // Return empty on error/not found
  }
});

/** 浏览目录 - 返回指定路径下的子文件夹列表 */
app.get('/api/browse', (req, res) => {
  const targetPath = (req.query.path as string) || '';
  try {
    // Windows: 如果没有路径或为空，返回磁盘盘符列表
    if (!targetPath || targetPath === '/') {
      if (process.platform === 'win32') {
        const drives: string[] = [];
        // 扫描 A-Z 盘符
        for (let i = 65; i <= 90; i++) {
          const letter = String.fromCharCode(i);
          const drivePath = `${letter}:\\`;
          try {
            readdirSync(drivePath);
            drives.push(drivePath);
          } catch {}
        }
        return res.json({ path: '/', items: drives.map(d => ({ name: d, path: d, isDir: true })) });
      } else {
        // Unix: 列出根目录
        const items = readdirSync('/').filter(n => {
          try { return require('fs').statSync('/' + n).isDirectory(); } catch { return false; }
        });
        return res.json({ path: '/', items: items.map(n => ({ name: n, path: '/' + n, isDir: true })) });
      }
    }

    const resolved = resolve(targetPath);
    const entries = readdirSync(resolved, { withFileTypes: true });
    const blacklist = ['node_modules', '.git', '$Recycle.Bin', 'System Volume Information', 'Recovery', 'PerfLogs'];
    const dirs = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.') && !e.name.startsWith('$') && !blacklist.includes(e.name))
      .map(e => ({ name: e.name, path: join(resolved, e.name), isDir: true }))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    res.json({ path: resolved, items: dirs });
  } catch (err: any) {
    res.status(400).json({ error: err.message, path: targetPath, items: [] });
  }
});

// 启动
const PORT = parseInt(process.env.PORT || '3120');
app.listen(PORT, () => {
  console.log(`\n  >> YCK Agent Web UI`);
  console.log(`  -----------------------------`);
  console.log(`  - http://localhost:${PORT}`);
  console.log(`  - Provider: ${getConfig().activeProvider}`);
  console.log(`  - Tools: ${globalToolRegistry.size}`);
  console.log(`  - Agents: ${coordinator.getAllAgents().length}`);
  console.log(`  -----------------------------\n`);
});
