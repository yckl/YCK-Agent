/**
 * YCK Agent - 功能演示脚本
 */
import chalk from 'chalk';
import { loadConfig, getConfig, getActiveModel } from './core/config/index.js';
import { registerBuiltinTools, globalToolRegistry } from './core/tools/index.js';
import { registerPresetAgents, coordinator } from './core/agents/index.js';
import { pluginManager } from './core/plugins/index.js';
import { showBanner } from './cli/components/banner.js';
import { SessionHistoryManager } from './core/assistant/sessionHistory.js';
import { trackTokenBudget } from './core/query/tokenBudget.js';

console.clear();

// 1. 加载配置
loadConfig();
const cfg = getConfig();

// 2. 注册工具
registerBuiltinTools();

// 3. 注册 Agent
registerPresetAgents();

// 4. 加载插件
const pluginCount = pluginManager.loadAll();

// ========== 展示 ==========

showBanner();

console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════'));
console.log(chalk.cyan.bold('   📊 YCK Agent 系统状态总览'));
console.log(chalk.cyan.bold('═══════════════════════════════════════════════\n'));

// 配置
console.log(chalk.yellow.bold('🔧 配置'));
console.log(chalk.gray('─────────────────────────────────────────'));
console.log(`  Provider:  ${chalk.white.bold(cfg.activeProvider)}`);
console.log(`  Model:     ${chalk.white.bold(getActiveModel())}`);
console.log(`  MaxTokens: ${chalk.white(String(cfg.maxTokens))}`);
console.log(`  Theme:     ${chalk.white(cfg.theme)}`);
console.log(`  Language:  ${chalk.white(cfg.language)}`);
console.log();

// Provider 状态
console.log(chalk.yellow.bold('📡 API Providers'));
console.log(chalk.gray('─────────────────────────────────────────'));
for (const [name, p] of Object.entries(cfg.providers)) {
  const status = p.apiKey ? chalk.green('✅ 已配置') : chalk.red('❌ 未配置');
  const active = name === cfg.activeProvider ? chalk.cyan(' ◀ ACTIVE') : '';
  console.log(`  ${name.padEnd(12)} ${status}  ${chalk.gray(p.models.default)}${active}`);
}
console.log();

// 工具
console.log(chalk.yellow.bold(`🛠️  工具系统 (${globalToolRegistry.size} 个)`));
console.log(chalk.gray('─────────────────────────────────────────'));
for (const cat of globalToolRegistry.getCategories()) {
  const tools = globalToolRegistry.getByCategory(cat);
  const names = tools.map(t => t.name).join(', ');
  console.log(`  ${chalk.cyan(`[${cat}]`.padEnd(12))} ${chalk.white(names)}`);
}
console.log();

// Agent
console.log(chalk.yellow.bold(`🤖 智能体 (${coordinator.getAllAgents().length} 个)`));
console.log(chalk.gray('─────────────────────────────────────────'));
for (const agent of coordinator.getAllAgents()) {
  const c = agent.config;
  const toolCount = c.tools?.length || 0;
  console.log(`  ${c.icon || '🤖'} ${chalk.hex(c.color || '#fff').bold(c.displayName.padEnd(10))} ${chalk.gray(c.description)} ${chalk.gray(`(${toolCount} 工具)`)}`);
}
console.log();

// 插件
console.log(chalk.yellow.bold(`🔌 插件系统`));
console.log(chalk.gray('─────────────────────────────────────────'));
if (pluginCount > 0) {
  for (const p of pluginManager.listPlugins()) {
    console.log(`  📦 ${chalk.white(p.name)} v${p.version} - ${chalk.gray(p.description)}`);
  }
} else {
  console.log(chalk.gray('  (在 plugins/ 目录下放置 plugin.json 扩展)'));
}
console.log();

// 记忆系统
console.log(chalk.yellow.bold(`🧠 智能记忆与上下文`));
console.log(chalk.gray('─────────────────────────────────────────'));
const sm = new SessionHistoryManager();
console.log(`  会话上下文树: ${chalk.white(String(sm.getContext().length))} 条记录`);
console.log();

// 上下文管理
console.log(chalk.yellow.bold(`📐 成本与 Tokens 预算`));
console.log(chalk.gray('─────────────────────────────────────────'));
console.log(`  自动裁剪机制: ${chalk.green('✅ 已启用 (Auto Pruning)')}`);
console.log(`  工具沙箱防护: ${chalk.green('✅ 已启用')}`);
console.log();

// 权限
console.log(chalk.yellow.bold(`🔐 权限控制`));
console.log(chalk.gray('─────────────────────────────────────────'));
console.log(`  读文件:    ${cfg.permissions.autoApproveRead ? chalk.green('自动批准') : chalk.yellow('需确认')}`);
console.log(`  写文件:    ${cfg.permissions.autoApproveWrite ? chalk.green('自动批准') : chalk.yellow('需确认')}`);
console.log(`  终端执行:  ${cfg.permissions.autoApproveTerminal ? chalk.green('自动批准') : chalk.yellow('需确认')}`);
console.log(`  网络请求:  ${cfg.permissions.autoApproveNetwork ? chalk.green('自动批准') : chalk.yellow('需确认')}`);
console.log();

// 使用说明
console.log(chalk.cyan.bold('═══════════════════════════════════════════════'));
console.log(chalk.cyan.bold('   🚀 使用方式'));
console.log(chalk.cyan.bold('═══════════════════════════════════════════════\n'));
console.log(chalk.white('  # 设置 API Key（自动打开浏览器）'));
console.log(chalk.green('  npx tsx src/cli/index.ts setup\n'));
console.log(chalk.white('  # 启动交互式对话'));
console.log(chalk.green('  npx tsx src/cli/index.ts\n'));
console.log(chalk.white('  # 直接提问（非交互模式）'));
console.log(chalk.green('  npx tsx src/cli/index.ts "帮我写一个 Python 爬虫"\n'));
console.log(chalk.white('  # 指定 Provider'));
console.log(chalk.green('  npx tsx src/cli/index.ts -p anthropic "分析这个项目"\n'));
console.log(chalk.cyan.bold('═══════════════════════════════════════════════\n'));
