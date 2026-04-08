/**
 * YCK Agent - AI 对话引擎
 * 支持 OpenAI 和 Anthropic 双协议，流式输出，Function Calling
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { getConfig, getActiveProvider, getActiveModel, getApiKey } from '../config/index.js';
import { globalToolRegistry } from '../tools/base.js';
import type { Message, AssistantMessage, ToolCall, StreamEvent, TokenUsage, QueryLoopState } from '../../types/message.js';
import type { ToolExecutionContext, ToolExecutionResult } from '../../types/tool.js';
import { ErrorRecoveryCascade } from './errorRecovery.js';
import { ContextCollapse } from './contextCollapse.js';
import { AutoCompact } from './autoCompact.js';
import { SnipCompact } from './snipCompact.js';
import { Microcompact } from './microcompact.js';
import { ToolResultBudgetAllocator } from './toolResultBudget.js';

// SOCKS5 代理支持（可选）
let SocksProxyAgent: any;
try {
  SocksProxyAgent = require('socks-proxy-agent').SocksProxyAgent;
} catch {}

let HttpsProxyAgent: any;
try {
  HttpsProxyAgent = require('https-proxy-agent').HttpsProxyAgent;
} catch {}

/** 引擎选项 */
export interface EngineOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  tools?: string[];
  abortSignal?: AbortSignal;
  onToolCall?: (name: string, args: Record<string, unknown>) => void;
  onToolResult?: (name: string, result: ToolExecutionResult) => void;
}

/** 对话引擎 - 核心 */
export class ChatEngine {
  private openaiClient: OpenAI | null = null;
  private anthropicClient: Anthropic | null = null;

  /** 获取 OpenAI 客户端（多 Key 时每次创建新实例） */
  private getOpenAI(): OpenAI {
    const provider = getActiveProvider();
    const hasMultiKeys = provider.apiKeys && provider.apiKeys.length > 1;

    if (!this.openaiClient || hasMultiKeys) {
      const baseURL = provider.baseUrl || 'https://api.openai.com/v1';
      const clientOpts: any = {
        apiKey: getApiKey(),
        baseURL,
        timeout: 30000, // 30 秒超时
      };

      // 检测是否需要代理（Google API 需要翻墙）
      if (baseURL.includes('googleapis.com')) {
        const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY;
        if (proxyUrl) {
          if (proxyUrl.startsWith('socks') && SocksProxyAgent) {
            clientOpts.httpAgent = new SocksProxyAgent(proxyUrl);
          } else if (HttpsProxyAgent) {
            clientOpts.httpAgent = new HttpsProxyAgent(proxyUrl);
          }
        } else if (SocksProxyAgent) {
          // 自动尝试 V2RayN 默认 SOCKS5 代理
          clientOpts.httpAgent = new SocksProxyAgent('socks5://127.0.0.1:10808');
        }
      }

      this.openaiClient = new OpenAI(clientOpts);
    }
    return this.openaiClient;
  }

  /** 获取 Anthropic 客户端 */
  private getAnthropic(): Anthropic {
    if (!this.anthropicClient) {
      this.anthropicClient = new Anthropic({
        apiKey: getApiKey(),
      });
    }
    return this.anthropicClient;
  }

  /** 重置客户端（切换 provider 后调用） */
  resetClients(): void {
    this.openaiClient = null;
    this.anthropicClient = null;
  }

  /** 流式对话 - 自动路由到对应 Provider */
  async *chat(messages: Message[], options: EngineOptions = {}): AsyncGenerator<StreamEvent> {
    const config = getConfig();
    const provider = config.activeProvider;

    if (provider === 'anthropic') {
      yield* this.chatAnthropic(messages, options);
    } else {
      // OpenAI、DeepSeek 以及其他兼容 OpenAI 格式的都走这个分支
      yield* this.chatOpenAI(messages, options);
    }
  }

  /** 非流式对话 - 包含完整的工具调用循环 */
  async run(messages: Message[], options: EngineOptions = {}): Promise<AssistantMessage> {
    const cwd = process.cwd();
    const maxIterations = 50;

    let state: QueryLoopState = {
      messages: [...messages],
      toolUseContext: { cwd, abortSignal: options.abortSignal },
      autoCompactTracking: 0,
      maxOutputTokensRecoveryCount: 0,
      hasAttemptedReactiveCompact: false,
      maxOutputTokensOverride: false,
      pendingToolUseSummary: '',
      stopHookActive: false,
      turnCount: 0,
      transition: 'continue'
    };

    while (true) {
      if (state.turnCount >= maxIterations) {
        throw new Error('Over maximum iteration bounds');
      }
      state.turnCount++;

      // ==========================================
      // L2: Snip Compact
      // ==========================================
      const { newMessages, snipTokensFreed } = SnipCompact.executeSnip(state.messages);
      state.messages = newMessages;

      // ==========================================
      // L3: Microcompact
      // ==========================================
      state.messages = Microcompact.execute(state.messages);

      // ==========================================
      // L4: Context Collapse Projection
      // ==========================================
      let projectedMessages = ContextCollapse.applyCollapsesIfNeeded(state.messages);

      // ==========================================
      // L5: Auto-Compact Check
      // ==========================================
      let estimatedTokens = state.messages.length * 100; // Mock estimation
      if (estimatedTokens > (options.maxTokens || 100_000) - 13_000) {
        if (state.autoCompactTracking < AutoCompact.MAX_FAILURES) {
           projectedMessages = await AutoCompact.executeMacro(projectedMessages, estimatedTokens);
           state.autoCompactTracking++;
        }
      }

      // 收集流式输出
      let fullContent = '';
      let toolCalls: ToolCall[] = [];
      let usage: TokenUsage | undefined;
      let thinking = '';

      try {
        for await (const event of this.chat(projectedMessages, options)) {
          switch (event.type) {
            case 'text_delta':
              fullContent += event.content || '';
              break;
            case 'thinking_delta':
              thinking += event.content || '';
              break;
            case 'tool_call_end':
              if (event.toolCall?.id && event.toolCall?.name) {
                toolCalls.push({
                  id: event.toolCall.id,
                  name: event.toolCall.name as string,
                  arguments: (event.toolCall.arguments || {}) as Record<string, unknown>,
                });
              }
              break;
            case 'done':
              usage = event.usage;
              break;
            case 'error':
              throw new Error(event.error || 'Unknown error');
          }
        }
      } catch (err: any) {
        // ==========================================
        // L6/7: Error Recovery Cascade
        // ==========================================
        ErrorRecoveryCascade.handleApiRejection(err, state);
        if (state.transition === 'collapse_drain_retry') continue;
        throw err;
      }

      // 创建助手消息
      const assistantMsg: AssistantMessage = {
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        thinking: thinking || undefined,
        model: options.model || getActiveModel(),
        usage,
      };
      state.messages.push(assistantMsg);

      // 如果没有工具调用，返回最终结果
      if (toolCalls.length === 0) {
        return assistantMsg;
      }

      // ==========================================
      // L1: Tool Result Budgeting Strategy Setup
      // ==========================================
      const rawResults: any[] = [];

      for (const tc of toolCalls) {
        options.onToolCall?.(tc.name, tc.arguments);
        const tool = globalToolRegistry.get(tc.name);
        let result: ToolExecutionResult;

        if (!tool) {
          result = { content: `工具 "${tc.name}" 未找到`, isError: true };
        } else {
          try {
            result = await tool.execute(tc.arguments, state.toolUseContext);
          } catch (err) {
            result = { content: `执行失败: ${err instanceof Error ? err.message : String(err)}`, isError: true };
          }
        }
        
        options.onToolResult?.(tc.name, result);
        rawResults.push({
          role: 'tool',
          content: result.content,
          toolCallId: tc.id,
          toolName: tc.name,
          isError: result.isError,
          timestamp: Date.now(),
          meta: {} // To be enriched
        });
      }

      // Apply Budget allocation
      const optimizedResults = ToolResultBudgetAllocator.applyBudgetLimits(rawResults);
      state.messages.push(...optimizedResults as any[]);

      // Reset states for successful round
      state.hasAttemptedReactiveCompact = false;
      state.transition = 'continue';
    }
  }

  /** OpenAI 格式流式对话 */
  private async *chatOpenAI(messages: Message[], options: EngineOptions): AsyncGenerator<StreamEvent> {
    const client = this.getOpenAI();
    const config = getConfig();
    const model = options.model || getActiveModel();
    const tools = globalToolRegistry.toOpenAIFunctions(options.tools);

    // 转换消息格式 (隐式注入 process.cwd() 让 AI 获取上下文感知)
    const activePrompt = (options.systemPrompt || config.systemPrompt || '') + `\n\n[系统环境]\n当前执行目录 (CWD): ${process.cwd()}`;
    const openaiMessages = this.toOpenAIMessages(messages, activePrompt);

    try {
      const createParams: any = {
        model,
        messages: openaiMessages,
        max_tokens: options.maxTokens || config.maxTokens,
        temperature: options.temperature ?? config.temperature,
        stream: true,
      };
      if (tools.length > 0) createParams.tools = tools;

      const stream: any = await client.chat.completions.create(createParams, {
        signal: options.abortSignal,
      });

      let currentToolCall: Partial<ToolCall> & { _argStr?: string } = {};
      let totalUsage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      let chunkCount = 0;

      for await (const chunk of stream) {
        chunkCount++;
        const choice = chunk.choices?.[0];
        if (!choice) continue;

        const delta = choice.delta;

        // 文本内容
        if (delta.content) {
          yield { type: 'text_delta', content: delta.content };
        }

        // 工具调用
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (tc.id) {
              // 新的工具调用开始
              if (currentToolCall.id) {
                // 结束上一个
                try {
                  currentToolCall.arguments = JSON.parse(currentToolCall._argStr || '{}');
                } catch { currentToolCall.arguments = {}; }
                yield { type: 'tool_call_end', toolCall: currentToolCall };
              }
              currentToolCall = { id: tc.id, name: tc.function?.name, _argStr: tc.function?.arguments || '' };
              yield { type: 'tool_call_start', toolCall: { id: tc.id, name: tc.function?.name } };
            } else if (tc.function?.arguments) {
              currentToolCall._argStr = (currentToolCall._argStr || '') + tc.function.arguments;
              yield { type: 'tool_call_delta', content: tc.function.arguments };
            }
          }
        }

        // 结束
        if (choice.finish_reason) {
          if (currentToolCall.id) {
            try {
              currentToolCall.arguments = JSON.parse(currentToolCall._argStr || '{}');
            } catch { currentToolCall.arguments = {}; }
            yield { type: 'tool_call_end', toolCall: currentToolCall };
            currentToolCall = {};
          }
        }

        // 使用量
        if (chunk.usage) {
          totalUsage = {
            promptTokens: chunk.usage.prompt_tokens,
            completionTokens: chunk.usage.completion_tokens,
            totalTokens: chunk.usage.total_tokens,
          };
        }
      }

      yield { type: 'done', usage: totalUsage };

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('aborted')) return;
      yield { type: 'error', error: msg };
    }
  }

  /** Anthropic 格式流式对话 */
  private async *chatAnthropic(messages: Message[], options: EngineOptions): AsyncGenerator<StreamEvent> {
    const client = this.getAnthropic();
    const config = getConfig();
    const model = options.model || getActiveModel();
    const tools = globalToolRegistry.toAnthropicTools(options.tools);

    // 转换消息格式 (隐式注入 process.cwd() 让 AI 获取上下文感知)
    const activePrompt = (options.systemPrompt || config.systemPrompt || '') + `\n\n[系统环境]\n当前执行目录 (CWD): ${process.cwd()}`;
    const { system, anthropicMessages } = this.toAnthropicMessages(messages, activePrompt);

    try {
      const stream = await client.messages.stream({
        model,
        system,
        messages: anthropicMessages,
        max_tokens: options.maxTokens || config.maxTokens,
        temperature: options.temperature ?? config.temperature,
        ...(tools.length > 0 ? { tools: tools as any } : {}),
      } as any);

      let currentToolId = '';
      let currentToolName = '';
      let currentToolArgs = '';

      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          const block = event.content_block as any;
          if (block.type === 'text') {
            // 文本开始
          } else if (block.type === 'tool_use') {
            currentToolId = block.id;
            currentToolName = block.name;
            currentToolArgs = '';
            yield { type: 'tool_call_start', toolCall: { id: currentToolId, name: currentToolName } };
          } else if (block.type === 'thinking') {
            // thinking 开始
          }
        } else if (event.type === 'content_block_delta') {
          const delta = event.delta as any;
          if (delta.type === 'text_delta') {
            yield { type: 'text_delta', content: delta.text };
          } else if (delta.type === 'input_json_delta') {
            currentToolArgs += delta.partial_json;
            yield { type: 'tool_call_delta', content: delta.partial_json };
          } else if (delta.type === 'thinking_delta') {
            yield { type: 'thinking_delta', content: delta.thinking };
          }
        } else if (event.type === 'content_block_stop') {
          if (currentToolId) {
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(currentToolArgs || '{}'); } catch {}
            yield { type: 'tool_call_end', toolCall: { id: currentToolId, name: currentToolName, arguments: args } };
            currentToolId = '';
            currentToolName = '';
            currentToolArgs = '';
          }
        } else if (event.type === 'message_delta') {
          // 消息结束
        }
      }

      const finalMessage = await stream.finalMessage();
      yield {
        type: 'done',
        usage: {
          promptTokens: finalMessage.usage.input_tokens,
          completionTokens: finalMessage.usage.output_tokens,
          totalTokens: finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
        },
      };

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('aborted')) return;
      yield { type: 'error', error: msg };
    }
  }

  /** 将消息转换为 OpenAI 格式 */
  private toOpenAIMessages(messages: Message[], systemPrompt: string): OpenAI.ChatCompletionMessageParam[] {
    const result: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of messages) {
      if (msg.role === 'user') {
        const umMsg = msg as any;
        if (umMsg.images && umMsg.images.length > 0) {
          const contentArray: any[] = [{ type: 'text', text: msg.content }];
          for (const img of umMsg.images) {
            contentArray.push({ type: 'image_url', image_url: { url: img } });
          }
          result.push({ role: 'user', content: contentArray });
        } else {
          result.push({ role: 'user', content: msg.content });
        }
      } else if (msg.role === 'assistant') {
        const am = msg as AssistantMessage;
        if (am.toolCalls && am.toolCalls.length > 0) {
          result.push({
            role: 'assistant',
            content: am.content || null,
            tool_calls: am.toolCalls.map(tc => ({
              id: tc.id,
              type: 'function' as const,
              function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
            })),
          });
        } else {
          result.push({ role: 'assistant', content: am.content });
        }
      } else if (msg.role === 'tool') {
        result.push({
          role: 'tool',
          tool_call_id: (msg as any).toolCallId,
          content: msg.content,
        });
      }
    }

    return result;
  }

  /** 将消息转换为 Anthropic 格式 */
  private toAnthropicMessages(messages: Message[], systemPrompt: string): {
    system: string;
    anthropicMessages: Anthropic.MessageParam[];
  } {
    const anthropicMessages: Anthropic.MessageParam[] = [];

    for (const msg of messages) {
      if (msg.role === 'user') {
        const umMsg = msg as any;
        if (umMsg.images && umMsg.images.length > 0) {
          const contentArray: any[] = [{ type: 'text', text: msg.content }];
          for (const imgBase64 of umMsg.images) {
             const parts = imgBase64.split(',');
             const match = parts[0].match(/:(.*?);/);
             if (match && parts[1]) {
                contentArray.push({
                  type: 'image',
                  source: {
                     type: 'base64',
                     media_type: match[1],
                     data: parts[1]
                  }
                });
             }
          }
          anthropicMessages.push({ role: 'user', content: contentArray });
        } else {
          anthropicMessages.push({ role: 'user', content: msg.content });
        }
      } else if (msg.role === 'assistant') {
        const am = msg as AssistantMessage;
        if (am.toolCalls && am.toolCalls.length > 0) {
          const content: any[] = [];
          if (am.content) {
            content.push({ type: 'text', text: am.content });
          }
          for (const tc of am.toolCalls) {
            content.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.arguments });
          }
          anthropicMessages.push({ role: 'assistant', content });
        } else {
          anthropicMessages.push({ role: 'assistant', content: am.content });
        }
      } else if (msg.role === 'tool') {
        const tm = msg as any;
        anthropicMessages.push({
          role: 'user',
          content: [{ type: 'tool_result', tool_use_id: tm.toolCallId, content: tm.content }],
        });
      }
    }

    return { system: systemPrompt, anthropicMessages };
  }
}

/** 全局引擎实例 */
export const chatEngine = new ChatEngine();
