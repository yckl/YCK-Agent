/**
 * YCK Agent - Agent 类型定义
 */

import type { AgentConfig } from './config.js';
import type { Message, TokenUsage } from './message.js';

/** Agent 状态 */
export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'waiting' | 'done' | 'error';

/** Agent 实例 */
export interface IAgent {
  config: AgentConfig;
  status: AgentStatus;
  
  /** 执行任务 */
  run(task: string, context: AgentContext): AsyncGenerator<AgentEvent>;
  /** 获取可用工具 */
  getTools(): string[];
}

/** Agent 执行上下文 */
export interface AgentContext {
  cwd: string;
  parentAgentId?: string;
  sharedMemory?: Record<string, unknown>;
  abortSignal?: AbortSignal;
  messages?: Message[];
}

/** Agent 事件 */
export interface AgentEvent {
  type: 'status' | 'message' | 'tool_use' | 'tool_result' | 'thinking' | 'error' | 'done';
  agentName: string;
  content?: string;
  data?: unknown;
}

/** 协调器任务 */
export interface CoordinatorTask {
  id: string;
  description: string;
  assignedAgent: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  result?: string;
  error?: string;
  dependencies?: string[];
}

/** 协调器计划 */
export interface CoordinatorPlan {
  goal: string;
  tasks: CoordinatorTask[];
  strategy: string;
}
