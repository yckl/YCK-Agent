/**
 * Agent 基类 - 参考 Claude Code 的 AgentTool 模式
 * 每个 Agent 有独立的系统提示词、工具集、模型配置
 */

import { chatEngine } from '../query/QueryEngine.js';
import { getConfig } from '../config/index.js';
import { globalToolRegistry } from '../tools/base.js';
import type { AgentConfig } from '../../types/config.js';
import type { AgentContext, AgentEvent, AgentStatus } from '../../types/agent.js';
import type { Message } from '../../types/message.js';

export class Agent {
  config: AgentConfig;
  status: AgentStatus = 'idle';
  private messages: Message[] = [];

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /** 执行任务 — 生成流式事件 */
  async *run(task: string, context: AgentContext): AsyncGenerator<AgentEvent> {
    this.status = 'thinking';
    yield { type: 'status', agentName: this.config.name, content: 'thinking' };

    // 构建消息
    this.messages = context.messages || [];
    this.messages.push({ role: 'user', content: task, timestamp: Date.now() });

    const systemPrompt = this.buildSystemPrompt(context);
    let fullContent = '';

    try {
      for await (const event of chatEngine.chat(this.messages, {
        systemPrompt,
        model: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        tools: this.config.tools,
        abortSignal: context.abortSignal,
        onToolCall: (name, args) => {
          this.status = 'executing';
        },
      })) {
        switch (event.type) {
          case 'text_delta':
            yield { type: 'message', agentName: this.config.name, content: event.content };
            fullContent += event.content || '';
            break;
          case 'thinking_delta':
            yield { type: 'thinking', agentName: this.config.name, content: event.content };
            break;
          case 'tool_call_start':
            this.status = 'executing';
            yield { type: 'tool_use', agentName: this.config.name, content: event.toolCall?.name, data: event.toolCall };
            break;
          case 'tool_call_end':
            yield { type: 'tool_result', agentName: this.config.name, data: event.toolCall };
            break;
          case 'error':
            this.status = 'error';
            yield { type: 'error', agentName: this.config.name, content: event.error };
            return;
        }
      }

      this.messages.push({ role: 'assistant', content: fullContent, timestamp: Date.now() });
      this.status = 'done';
      yield { type: 'done', agentName: this.config.name, content: fullContent };

    } catch (err: any) {
      this.status = 'error';
      yield { type: 'error', agentName: this.config.name, content: err.message };
    }
  }

  /** 构建系统提示词 */
  private buildSystemPrompt(context: AgentContext): string {
    const parts = [this.config.systemPrompt];

    if (context.sharedMemory && Object.keys(context.sharedMemory).length > 0) {
      parts.push('\n## 共享信息\n' + JSON.stringify(context.sharedMemory, null, 2));
    }

    if (context.parentAgentId) {
      parts.push(`\n你是由协调器分配的子 Agent。专注完成分配给你的具体任务，给出精确结果。`);
    }

    // 添加可用工具列表说明
    if (this.config.tools && this.config.tools.length > 0) {
      const toolDescs = this.config.tools
        .map(name => globalToolRegistry.get(name))
        .filter(Boolean)
        .map(t => `- ${t!.name}: ${t!.description}`)
        .join('\n');
      if (toolDescs) {
        parts.push(`\n## 你的可用工具\n${toolDescs}`);
      }
    }

    return parts.join('\n');
  }

  /** 获取可用工具 */
  getTools(): string[] {
    return this.config.tools || globalToolRegistry.getAll().map(t => t.name);
  }

  /** 重置对话 */
  reset(): void {
    this.messages = [];
    this.status = 'idle';
  }
}
