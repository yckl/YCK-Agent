/**
 * YCK Agent - 工具类型定义
 */

import type { ToolCall, ToolResult } from './message.js';

/** JSON Schema 类型 */
export interface JSONSchema {
  type: string;
  description?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  items?: JSONSchema;
  enum?: string[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
}

/** 工具参数定义 */
export interface ToolParameter {
  name: string;
  description: string;
  schema: JSONSchema;
}

/** 工具定义 */
export interface ToolDefinition {
  /** 工具名称（唯一标识） */
  name: string;
  /** 工具描述（给 AI 看） */
  description: string;
  /** 工具分类 */
  category: ToolCategory;
  /** 参数 JSON Schema */
  parameters: JSONSchema;
  /** 是否需要用户确认 */
  requiresConfirmation: boolean;
  /** 是否危险操作 */
  isDangerous: boolean;
}

/** 工具分类 */
export type ToolCategory =
  | 'file'       // 文件操作
  | 'terminal'   // 终端执行
  | 'search'     // 搜索
  | 'web'        // 网络
  | 'code'       // 代码分析
  | 'data'       // 数据处理
  | 'devops'     // 运维
  | 'comm'       // 通信
  | 'system'     // 系统
  | 'custom';    // 自定义

/** 工具执行上下文 */
export interface ToolExecutionContext {
  cwd: string;
  abortSignal?: AbortSignal;
  onProgress?: (message: string) => void;
}

/** 工具执行结果 */
export interface ToolExecutionResult {
  content: string;
  isError: boolean;
  metadata?: Record<string, unknown>;
}

/** 工具接口 */
export interface ITool extends ToolDefinition {
  /** 执行工具 */
  execute(args: Record<string, unknown>, context: ToolExecutionContext): Promise<ToolExecutionResult>;
  /** 转换为 OpenAI function 格式 */
  toOpenAIFunction(): OpenAIFunction;
  /** 转换为 Anthropic tool 格式 */
  toAnthropicTool(): AnthropicTool;
}

/** OpenAI Function 格式 */
export interface OpenAIFunction {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: JSONSchema;
  };
}

/** Anthropic Tool 格式 */
export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: JSONSchema;
}
