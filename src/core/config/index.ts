/**
 * YCK Agent - 配置管理器
 * 管理多 Provider 配置、API Key、权限等
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { homedir } from 'os';
import type { AppConfig, ProviderConfig } from '../../types/config.js';

const DEFAULT_CONFIG_PATHS = [
  resolve(process.cwd(), 'config.json'),
  resolve(process.cwd(), 'ycka.config.json'),
  resolve(homedir(), '.ycka', 'config.json'),
];

let _config: AppConfig | null = null;
let _configPath: string | null = null;

/** 获取默认配置 */
function getDefaultConfig(): AppConfig {
  return {
    providers: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        models: { default: 'gpt-4o-mini', powerful: 'gpt-4o', fast: 'gpt-4o-mini' },
      },
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        models: { default: 'claude-sonnet-4-20250514', powerful: 'claude-opus-4-20250514', fast: 'claude-haiku-3-5-20241022' },
      },
      deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        baseUrl: 'https://api.deepseek.com/v1',
        models: { default: 'deepseek-chat', powerful: 'deepseek-chat', fast: 'deepseek-chat' },
      },
    },
    activeProvider: 'openai',
    activeModel: 'default',
    effortLevel: 'medium',
    maxTokens: 4096,
    temperature: 0.7,
    systemPrompt: '你是 YCK Agent，一个全能 AI 智能体助手。你能够使用各种工具来帮助用户完成任务。',
    theme: 'dark',
    language: 'zh-CN',
    memory: { enabled: true, maxHistory: 100, persistPath: resolve(homedir(), '.ycka', 'memory') },
    permissions: { autoApproveRead: true, autoApproveWrite: false, autoApproveTerminal: false, autoApproveNetwork: true },
  };
}

/** 加载配置文件 */
export function loadConfig(customPath?: string): AppConfig {
  if (_config) return _config;

  const paths = customPath ? [resolve(customPath)] : DEFAULT_CONFIG_PATHS;

  for (const p of paths) {
    if (existsSync(p)) {
      try {
        const raw = readFileSync(p, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<AppConfig>;
        _config = { ...getDefaultConfig(), ...parsed } as AppConfig;
        _configPath = p;

        // 环境变量覆盖
        if (process.env.OPENAI_API_KEY && _config.providers.openai) {
          _config.providers.openai.apiKey = process.env.OPENAI_API_KEY;
        }
        if (process.env.ANTHROPIC_API_KEY && _config.providers.anthropic) {
          _config.providers.anthropic.apiKey = process.env.ANTHROPIC_API_KEY;
        }
        if (process.env.DEEPSEEK_API_KEY && _config.providers.deepseek) {
          _config.providers.deepseek.apiKey = process.env.DEEPSEEK_API_KEY;
        }
        if (process.env.YCKA_PROVIDER) {
          _config.activeProvider = process.env.YCKA_PROVIDER;
        }
        if (process.env.YCKA_MODEL) {
          _config.activeModel = process.env.YCKA_MODEL;
        }
        if (process.env.CLAUDE_CODE_EFFORT_LEVEL || process.env.YCKA_EFFORT_LEVEL) {
          const effortEnv = (process.env.CLAUDE_CODE_EFFORT_LEVEL || process.env.YCKA_EFFORT_LEVEL)!.toLowerCase();
          if (['low', 'medium', 'high', 'max'].includes(effortEnv)) {
             _config.effortLevel = effortEnv as any;
          }
        }

        return _config;
      } catch {
        // 继续尝试下一个路径
      }
    }
  }

  // 没找到配置文件，使用默认
  _config = getDefaultConfig();
  return _config;
}

/** 保存配置 */
export function saveConfig(config?: AppConfig): void {
  const cfg = config || _config;
  if (!cfg) return;

  const savePath = _configPath || DEFAULT_CONFIG_PATHS[0]!;
  const dir = dirname(savePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  writeFileSync(savePath, JSON.stringify(cfg, null, 2), 'utf-8');
  _config = cfg;
  _configPath = savePath;
}

/** 获取当前配置 */
export function getConfig(): AppConfig {
  return _config || loadConfig();
}

/** 获取当前 Provider 配置 */
export function getActiveProvider(): ProviderConfig {
  const cfg = getConfig();
  const provider = cfg.providers[cfg.activeProvider];
  if (!provider) {
    throw new Error(`Provider "${cfg.activeProvider}" 未配置。请检查 config.json`);
  }
  return provider;
}

/** 获取当前模型名 */
export function getActiveModel(): string {
  const cfg = getConfig();
  const provider = getActiveProvider();
  const modelKey = cfg.activeModel as keyof typeof provider.models;
  return provider.models[modelKey] || provider.models.default || cfg.activeModel;
}

let _keyIndex = 0;

/** 获取 API Key（支持多 Key 轮询） */
export function getApiKey(): string {
  const provider = getActiveProvider();

  // 多 Key 轮询
  if (provider.apiKeys && provider.apiKeys.length > 0) {
    const key = provider.apiKeys[_keyIndex % provider.apiKeys.length]!;
    _keyIndex++;
    return key;
  }

  if (!provider.apiKey) {
    const cfg = getConfig();
    throw new Error(
      `${cfg.activeProvider} 的 API Key 未设置。\n` +
      `请在 config.json 中设置，或通过环境变量设置。`
    );
  }
  return provider.apiKey;
}

/** 切换 Provider */
export function switchProvider(name: string): void {
  const cfg = getConfig();
  if (!cfg.providers[name]) {
    throw new Error(`未知的 Provider: ${name}。可用: ${Object.keys(cfg.providers).join(', ')}`);
  }
  cfg.activeProvider = name;
  saveConfig(cfg);
}

/** 切换模型 */
export function switchModel(model: string): void {
  const cfg = getConfig();
  cfg.activeModel = model;
  saveConfig(cfg);
}

/** 切换 Effort Level */
export function switchEffortLevel(level: 'low' | 'medium' | 'high' | 'max'): void {
  const cfg = getConfig();
  cfg.effortLevel = level;
  saveConfig(cfg);
}

/** 设置 API Key */
export function setApiKey(provider: string, key: string): void {
  const cfg = getConfig();
  if (!cfg.providers[provider]) {
    cfg.providers[provider] = { apiKey: key, models: { default: '', powerful: '', fast: '' } };
  } else {
    cfg.providers[provider]!.apiKey = key;
  }
  saveConfig(cfg);
}

/** 重置配置缓存 */
export function resetConfig(): void {
  _config = null;
  _configPath = null;
}
