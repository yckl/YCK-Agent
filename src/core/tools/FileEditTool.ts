/**
 * 文件编辑工具 - 精确替换文件中的指定内容
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { BaseTool } from './base.js';
import type { JSONSchema, ToolExecutionContext, ToolExecutionResult } from '../../types/tool.js';

export class FileEditTool extends BaseTool {
  name = 'file_edit';
  description = '精确编辑文件：搜索指定文本并替换为新内容。适合对已有文件进行修改。';
  category = 'file' as const;
  requiresConfirmation = true;
  parameters: JSONSchema = {
    type: 'object',
    properties: {
      path: { type: 'string', description: '文件路径' },
      search: { type: 'string', description: '要查找的精确文本（必须完全匹配文件中的内容）' },
      replace: { type: 'string', description: '替换后的新内容' },
    },
    required: ['path', 'search', 'replace'],
  };

  async execute(args: Record<string, unknown>, ctx: ToolExecutionContext): Promise<ToolExecutionResult> {
    try {
      const filePath = resolve(ctx.cwd, args.path as string);
      const search = args.search as string;
      const replace = args.replace as string;
      const content = readFileSync(filePath, 'utf-8');

      if (!content.includes(search)) {
        return this.error(`在文件中未找到指定的搜索文本。\n搜索: "${search.slice(0, 100)}..."`);
      }

      const count = content.split(search).length - 1;
      if (count > 1) {
        return this.error(`找到 ${count} 处匹配，请提供更精确的搜索文本以避免歧义。`);
      }

      const newContent = content.replace(search, replace);
      writeFileSync(filePath, newContent, 'utf-8');
      return this.success(`文件已编辑: ${filePath}\n替换了 1 处匹配`);
    } catch (err: any) {
      return this.error(err.message);
    }
  }
}
