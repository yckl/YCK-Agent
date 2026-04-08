/**
 * 文件读取工具
 */
import { readFileSync, statSync } from 'fs';
import { resolve } from 'path';
import { BaseTool } from './base.js';
import type { JSONSchema, ToolExecutionContext, ToolExecutionResult } from '../../types/tool.js';

export class FileReadTool extends BaseTool {
  name = 'file_read';
  description = '读取文件内容。支持文本文件，可指定行范围。';
  category = 'file' as const;
  parameters: JSONSchema = {
    type: 'object',
    properties: {
      path: { type: 'string', description: '文件路径（相对或绝对）' },
      startLine: { type: 'number', description: '起始行号（1-indexed，可选）' },
      endLine: { type: 'number', description: '结束行号（1-indexed，可选）' },
    },
    required: ['path'],
  };

  async execute(args: Record<string, unknown>, ctx: ToolExecutionContext): Promise<ToolExecutionResult> {
    try {
      const filePath = resolve(ctx.cwd, args.path as string);
      const stat = statSync(filePath);
      if (stat.size > 5 * 1024 * 1024) return this.error('文件过大（>5MB），请指定行范围');

      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const start = (args.startLine as number) || 1;
      const end = (args.endLine as number) || lines.length;
      const selected = lines.slice(start - 1, end);
      const numbered = selected.map((l, i) => `${start + i}: ${l}`).join('\n');

      return this.success(`文件: ${filePath} (${lines.length} 行)\n${numbered}`);
    } catch (err: any) {
      return this.error(err.message);
    }
  }
}
