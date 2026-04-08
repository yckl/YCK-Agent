/**
 * 文件写入工具
 */
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { BaseTool } from './base.js';
import type { JSONSchema, ToolExecutionContext, ToolExecutionResult } from '../../types/tool.js';

export class FileWriteTool extends BaseTool {
  name = 'file_write';
  description = '创建或覆盖文件。自动创建不存在的父目录。';
  category = 'file' as const;
  requiresConfirmation = true;
  parameters: JSONSchema = {
    type: 'object',
    properties: {
      path: { type: 'string', description: '文件路径' },
      content: { type: 'string', description: '文件内容' },
    },
    required: ['path', 'content'],
  };

  async execute(args: Record<string, unknown>, ctx: ToolExecutionContext): Promise<ToolExecutionResult> {
    try {
      const filePath = resolve(ctx.cwd, args.path as string);
      const dir = dirname(filePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(filePath, args.content as string, 'utf-8');
      return this.success(`文件已写入: ${filePath}`);
    } catch (err: any) {
      return this.error(err.message);
    }
  }
}
