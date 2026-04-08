/**
 * YCK Agent - 工具基类 & 注册系统
 * 参考 Claude Code 的工具架构设计
 */

import type {
  ITool, ToolCategory, JSONSchema, ToolExecutionContext,
  ToolExecutionResult, OpenAIFunction, AnthropicTool,
} from '../../types/tool.js';

/** 工具基类 - 所有工具继承此类 */
export abstract class BaseTool implements ITool {
  abstract name: string;
  abstract description: string;
  abstract category: ToolCategory;
  abstract parameters: JSONSchema;

  requiresConfirmation = false;
  isDangerous = false;

  /** 子类实现具体执行逻辑 */
  abstract execute(
    args: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult>;

  /** 转换为 OpenAI function calling 格式 */
  toOpenAIFunction(): OpenAIFunction {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: this.parameters,
      },
    };
  }

  /** 转换为 Anthropic tool 格式 */
  toAnthropicTool(): AnthropicTool {
    return {
      name: this.name,
      description: this.description,
      input_schema: this.parameters,
    };
  }

  /** 成功结果快捷方法 */
  protected success(content: string, metadata?: Record<string, unknown>): ToolExecutionResult {
    return { content, isError: false, metadata };
  }

  /** 错误结果快捷方法 */
  protected error(content: string, metadata?: Record<string, unknown>): ToolExecutionResult {
    return { content: `Error: ${content}`, isError: true, metadata };
  }
}

/** 工具注册表 - 管理所有可用工具 */
export class ToolRegistry {
  private tools = new Map<string, ITool>();
  private categories = new Map<ToolCategory, Set<string>>();

  /** 注册工具 */
  register(tool: ITool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`工具 "${tool.name}" 已注册`);
    }
    this.tools.set(tool.name, tool);

    if (!this.categories.has(tool.category)) {
      this.categories.set(tool.category, new Set());
    }
    this.categories.get(tool.category)!.add(tool.name);
  }

  /** 批量注册 */
  registerAll(tools: ITool[]): void {
    for (const tool of tools) {
      this.register(tool);
    }
  }

  /** 注销工具 */
  unregister(name: string): boolean {
    const tool = this.tools.get(name);
    if (!tool) return false;
    this.tools.delete(name);
    this.categories.get(tool.category)?.delete(name);
    return true;
  }

  /** 获取工具 */
  get(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  /** 获取所有工具 */
  getAll(): ITool[] {
    return Array.from(this.tools.values());
  }

  /** 按分类获取工具 */
  getByCategory(category: ToolCategory): ITool[] {
    const names = this.categories.get(category);
    if (!names) return [];
    return Array.from(names).map(n => this.tools.get(n)!).filter(Boolean);
  }

  /** 按名称列表获取工具 */
  getByNames(names: string[]): ITool[] {
    return names.map(n => this.tools.get(n)).filter((t): t is ITool => t !== undefined);
  }

  /** 获取所有工具的 OpenAI function 格式 */
  toOpenAIFunctions(names?: string[]): OpenAIFunction[] {
    const tools = names ? this.getByNames(names) : this.getAll();
    return tools.map(t => t.toOpenAIFunction());
  }

  /** 获取所有工具的 Anthropic tool 格式 */
  toAnthropicTools(names?: string[]): AnthropicTool[] {
    const tools = names ? this.getByNames(names) : this.getAll();
    return tools.map(t => t.toAnthropicTool());
  }

  /** 获取工具数量 */
  get size(): number {
    return this.tools.size;
  }

  /** 获取所有分类 */
  getCategories(): ToolCategory[] {
    return Array.from(this.categories.keys());
  }

  /** 获取工具名称摘要 */
  getSummary(): string {
    const categories = this.getCategories();
    return categories
      .map(cat => {
        const tools = this.getByCategory(cat);
        return `${cat}: ${tools.map(t => t.name).join(', ')}`;
      })
      .join('\n');
  }
}

/** 全局工具注册表实例 */
export const globalToolRegistry = new ToolRegistry();
