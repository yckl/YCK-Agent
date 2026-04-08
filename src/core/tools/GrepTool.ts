/**
 * 文本搜索工具 (grep)
 */
import { execSync } from 'child_process';
import { BaseTool } from './base.js';
import type { JSONSchema, ToolExecutionContext, ToolExecutionResult } from '../../types/tool.js';

export class GrepTool extends BaseTool {
  name = 'grep';
  description = '在文件中搜索文本模式，类似 grep。支持正则表达式和文件类型过滤。';
  category = 'search' as const;
  parameters: JSONSchema = {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: '搜索模式（支持正则表达式）' },
      path: { type: 'string', description: '搜索路径（文件或目录）' },
      includes: { type: 'string', description: '文件类型过滤，如 "*.ts"' },
      caseSensitive: { type: 'boolean', description: '是否区分大小写（默认 false）' },
      maxResults: { type: 'number', description: '最大结果数（默认 50）' },
    },
    required: ['pattern', 'path'],
  };

  async execute(args: Record<string, unknown>, ctx: ToolExecutionContext): Promise<ToolExecutionResult> {
    const pattern = args.pattern as string;
    const searchPath = args.path as string || '.';
    const includes = args.includes as string;
    const caseSensitive = args.caseSensitive as boolean ?? false;
    const maxResults = (args.maxResults as number) || 50;

    // 尝试 ripgrep，降级到 findstr/grep
    const isWindows = process.platform === 'win32';
    let command: string;

    try {
      // 尝试用 ripgrep
      const flags = caseSensitive ? '' : '-i';
      const includeFlag = includes ? `--glob "${includes}"` : '';
      command = `rg ${flags} -n --max-count ${maxResults} ${includeFlag} "${pattern}" "${searchPath}"`;
      const output = execSync(command, { cwd: ctx.cwd, encoding: 'utf-8', timeout: 10000 });
      return this.success(output || '未找到匹配');
    } catch {
      // ripgrep 不可用，降级
      try {
        if (isWindows) {
          const flag = caseSensitive ? '' : '/I';
          command = `findstr /S /N ${flag} "${pattern}" "${searchPath}\\*"`;
        } else {
          const flag = caseSensitive ? '' : '-i';
          command = `grep -rn ${flag} --max-count=${maxResults} "${pattern}" "${searchPath}"`;
        }
        const output = execSync(command, { cwd: ctx.cwd, encoding: 'utf-8', timeout: 10000 });
        return this.success(output || '未找到匹配');
      } catch (err: any) {
        if (err.status === 1) return this.success('未找到匹配');
        return this.error(err.message);
      }
    }
  }
}
