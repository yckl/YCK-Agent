/**
 * YCK Agent - 消息类型定义
 */

/** 消息角色 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/** 工具调用 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/** 工具调用结果元数据（用于预算与重用） */
export interface ToolResultMeta {
  replacementTag?: string;
  frozenAt?: number;
  diskPath?: string;
}

/** 工具调用结果 */
export interface ToolResult {
  toolCallId: string;
  name: string;
  content: string;
  isError?: boolean;
  meta?: ToolResultMeta;
}

/** 基础消息 */
export interface BaseMessage {
  role: MessageRole;
  content: string;
  timestamp: number;
}

/** 用户消息 */
export interface UserMessage extends BaseMessage {
  role: 'user';
  images?: string[]; // Array of base64 data URIs
}

/** 系统消息 */
export interface SystemMessage extends BaseMessage {
  role: 'system';
}

/** 助手消息 */
export interface AssistantMessage extends BaseMessage {
  role: 'assistant';
  toolCalls?: ToolCall[];
  thinking?: string;
  model?: string;
  usage?: TokenUsage;
}

/** 工具消息 */
export interface ToolMessage extends BaseMessage {
  role: 'tool';
  toolCallId: string;
  toolName: string;
  isError?: boolean;
}

/** 消息联合类型 */
export type Message = UserMessage | SystemMessage | AssistantMessage | ToolMessage;

/** Token 使用量 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** 流式事件 */
export interface StreamEvent {
  type: 'text_delta' | 'tool_call_start' | 'tool_call_delta' | 'tool_call_end' | 'thinking_delta' | 'done' | 'error';
  content?: string;
  toolCall?: Partial<ToolCall>;
  error?: string;
  usage?: TokenUsage;
}

/** 上下文压缩边界 */
export interface CompactBoundary {
  id: string;
  tokensFreed: number;
  reason: string;
  strategy: string;
  preservedToolIds: string[];
}

/** 状态机跃迁类型 */
export type StateTransition = 
  | 'continue'
  | 'collapse_drain_retry'
  | 'reactive_compact_retry'
  | 'max_output_tokens_escalate'
  | 'max_output_tokens_recovery'
  | 'stop_hook_blocking'
  | 'token_budget_continuation';

/** 分析控制循环状态机 */
export interface QueryLoopState {
  messages: Message[];
  toolUseContext: any;
  autoCompactTracking: number;
  maxOutputTokensRecoveryCount: number;
  hasAttemptedReactiveCompact: boolean;
  maxOutputTokensOverride: boolean;
  pendingToolUseSummary: string;
  stopHookActive: boolean;
  turnCount: number;
  transition: StateTransition | null;
}
