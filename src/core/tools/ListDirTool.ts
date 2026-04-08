/**
 * 目录列表工具
 */
import { readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { BaseTool } from './base.js';
import type { JSONSchema, ToolExecutionContext, ToolExecutionResult } from '../../types/tool.js';

export class ListDirTool extends BaseTool {
  name = 'list_dir';
  description = '列出目录内容，显示文件和子目录的名称、类型、大小。';
  category = 'file' as const;
  parameters: JSONSchema = {
    type: 'object',
    properties: {
      path: { type: 'string', description: '目录路径（默认当前目录）' },
      recursive: { type: 'boolean', description: '是否递归（默认 false，最多 2 层）' },
    },
    required: [],
  };

  async execute(args: Record<string, unknown>, ctx: ToolExecutionContext): Promise<ToolExecutionResult> {
    try {
      const dirPath = resolve(ctx.cwd, (args.path as string) || '.');
      const recursive = args.recursive as boolean ?? false;
      const lines: string[] = [`📁 ${dirPath}\n`];
      this.listDir(dirPath, lines, '', recursive ? 2 : 0, 0);
      return this.success(lines.join('\n'));
    } catch (err: any) {
      return this.error(err.message);
    }
  }

  private listDir(dir: string, lines: string[], prefix: string, maxDepth: number, depth: number): void {
    const entries = readdirSync(dir).filter(e => !e.startsWith('.')).sort();
    for (const entry of entries.slice(0, 100)) { // 限制每层100个
      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          lines.push(`${prefix}📂 ${entry}/`);
          if (depth < maxDepth) {
            this.listDir(fullPath, lines, prefix + '  ', maxDepth, depth + 1);
          }
        } else {
          const size = this.formatSize(stat.size);
          lines.push(`${prefix}📄 ${entry} (${size})`);
        }
      } catch { /* skip inaccessible */ }
    }
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  }
}
