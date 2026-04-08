import { z } from 'zod';
import { BaseTool } from '../base.js';
import { ToolExecutionContext, ToolExecutionResult, ToolCategory } from '../../../types/tool.js';

export type AnyObject = z.ZodType<{ [key: string]: unknown }>;

export interface ToolContext {
  cwd: string;
  [key: string]: any;
}

export abstract class ZodTool<Input extends AnyObject = AnyObject, Output = any> extends BaseTool {
  abstract inputSchema: Input;
  abstract call(args: z.infer<Input>, context: ToolContext): Promise<Output>;

  // Adapter method to match YCK-Agent's BaseTool execute method
  async execute(args: Record<string, unknown>, sdkContext?: ToolExecutionContext): Promise<ToolExecutionResult> {
    try {
      const parsedArgs = this.inputSchema.parse(args);
      const result = await this.call(parsedArgs, { cwd: sdkContext?.cwd || process.cwd() });
      const content = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
      return { content, isError: false };
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return { content: `输入参数验证失败: ${e.errors.map((err: any) => err.message).join(', ')}`, isError: true };
      }
      return { content: `Error: ${e.message}`, isError: true };
    }
  }

  // Abstract adapter properties
  get parameters() {
    // Basic conversion from Zod to JSON Schema format for YCK-Agent
    return {
      type: 'object',
      properties: Object.keys((this.inputSchema as any).shape || {}).reduce((acc: any, key) => {
        acc[key] = { type: 'string' }; // Fallback rough translation
        return acc;
      }, {}),
    };
  }
}
