/**
 * 多文件编辑工具 - 一次修改多个文件的多个位置
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { BaseTool } from './base.js';
import type { JSONSchema, ToolExecutionContext, ToolExecutionResult } from '../../types/tool.js';

export class MultiEditTool extends BaseTool {
  name = 'multi_edit';
  description = '一次性对多个文件进行多处编辑。每个编辑指定文件路径、搜索文本、替换文本。';
  category = 'file' as const;
  requiresConfirmation = true;
  parameters: JSONSchema = {
    type: 'object',
    properties: {
      edits: {
        type: 'array',
        description: '编辑列表',
        items: {
          type: 'object',
          properties: {
            path: { type: 'string', description: '文件路径' },
            search: { type: 'string', description: '要查找的文本' },
            replace: { type: 'string', description: '替换成的文本' },
          },
          required: ['path', 'search', 'replace'],
        },
      },
    },
    required: ['edits'],
  };

  async execute(args: Record<string, unknown>, ctx: ToolExecutionContext): Promise<ToolExecutionResult> {
    const edits = args.edits as Array<{ path: string; search: string; replace: string }>;
    const results: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const edit of edits) {
      try {
        const filePath = resolve(ctx.cwd, edit.path);
        const content = readFileSync(filePath, 'utf-8');
        if (!content.includes(edit.search)) {
          results.push(`❌ ${edit.path}: 未找到搜索文本`);
          errorCount++;
          continue;
        }
        writeFileSync(filePath, content.replace(edit.search, edit.replace), 'utf-8');
        results.push(`✅ ${edit.path}: 已编辑`);
        successCount++;
      } catch (err: any) {
        results.push(`❌ ${edit.path}: ${err.message}`);
        errorCount++;
      }
    }

    return this.success(`多文件编辑完成: ${successCount} 成功, ${errorCount} 失败\n${results.join('\n')}`);
  }
}
