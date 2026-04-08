/**
 * YCK Agent - 配置类型定义
 */

/** API 提供者配置 */
export interface ProviderConfig {
  apiKey: string;
  apiKeys?: string[];  // 多 Key 轮询
  baseUrl?: string;
  models: {
    default: string;
    powerful: string;
    fast: string;
  };
}

/** 提供者名称 */
export type ProviderName = 'openai' | 'anthropic' | 'deepseek' | 'ollama' | 'custom';

/** 权限配置 */
export interface PermissionsConfig {
  autoApproveRead: boolean;
  autoApproveWrite: boolean;
  autoApproveTerminal: boolean;
  autoApproveNetwork: boolean;
}

/** 记忆配置 */
export interface MemoryConfig {
  enabled: boolean;
  maxHistory: number;
  persistPath: string;
}

/** 主配置 */
export interface AppConfig {
  providers: Record<string, ProviderConfig>;
  activeProvider: string;
  activeModel: 'default' | 'powerful' | 'fast' | string;
  effortLevel: 'low' | 'medium' | 'high' | 'max';
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  theme: 'dark' | 'light' | 'auto';
  language: string;
  memory: MemoryConfig;
  permissions: PermissionsConfig;
}

/** Agent 配置 */
export interface AgentConfig {
  name: string;
  displayName: string;
  description: string;
  systemPrompt: string;
  model?: string;
  tools?: string[];
  temperature?: number;
  maxTokens?: number;
  color?: string;
  icon?: string;
}
