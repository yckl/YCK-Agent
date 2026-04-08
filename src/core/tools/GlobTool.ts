/**
 * 文件 Glob 匹配工具
 */
import { execSync } from 'child_process';
import { resolve } from 'path';
import { BaseTool } from './base.js';
import type { JSONSchema, ToolExecutionContext, ToolExecutionResult } from '../../types/tool.js';

export class GlobTool extends BaseTool {
  name = 'glob';
  description = '按文件名模式搜索文件，如 "**/*.ts"、"src/**/*.vue"。';
  category = 'search' as const;
  parameters: JSONSchema = {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: 'Glob 模式，如 **/*.ts' },
      path: { type: 'string', description: '搜索的根目录（默认当前目录）' },
    },
    required: ['pattern'],
  };

  async execute(args: Record<string, unknown>, ctx: ToolExecutionContext): Promise<ToolExecutionResult> {
    const pattern = args.pattern as string;
    const searchPath = resolve(ctx.cwd, (args.path as string) || '.');
    const isWindows = process.platform === 'win32';

    try {
      let cmd: string;
      if (isWindows) {
        cmd = `Get-ChildItem -Path "${searchPath}" -Recurse -Filter "${pattern.replace('**/', '')}" -Name | Select-Object -First 100`;
        const output = execSync(`powershell -Command "${cmd}"`, { encoding: 'utf-8', timeout: 10000 });
        return this.success(output || '未找到匹配文件');
      } else {
        cmd = `find "${searchPath}" -name "${pattern.replace('**/', '')}" -type f | head -100`;
        const output = execSync(cmd, { encoding: 'utf-8', timeout: 10000 });
        return this.success(output || '未找到匹配文件');
      }
    } catch (err: any) {
      return this.error(err.message);
    }
  }
}
