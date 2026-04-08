/**
 * 终端执行工具
 */
import { execSync } from 'child_process';
import { BaseTool } from './base.js';
import type { JSONSchema, ToolExecutionContext, ToolExecutionResult } from '../../types/tool.js';

export class TerminalTool extends BaseTool {
  name = 'terminal';
  description = '在终端中执行 Shell 命令（Windows 为 PowerShell，其他为 bash）。可执行任意命令，包括安装包、运行脚本、git 操作等。';
  category = 'terminal' as const;
  requiresConfirmation = true;
  isDangerous = true;
  parameters: JSONSchema = {
    type: 'object',
    properties: {
      command: { type: 'string', description: '要执行的命令' },
      cwd: { type: 'string', description: '工作目录（可选，默认当前目录）' },
      timeout: { type: 'number', description: '超时毫秒数（默认 30000）' },
    },
    required: ['command'],
  };

  async execute(args: Record<string, unknown>, ctx: ToolExecutionContext): Promise<ToolExecutionResult> {
    const command = args.command as string;
    const cwd = (args.cwd as string) ? (args.cwd as string) : ctx.cwd;
    const timeout = (args.timeout as number) || 30000;
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? 'powershell.exe' : '/bin/bash';

    try {
      const output = execSync(command, {
        cwd,
        timeout,
        encoding: 'utf-8',
        shell,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        env: { ...process.env, PAGER: 'cat' },
      });
      const trimmed = output.length > 50000 ? output.slice(0, 50000) + '\n...(输出被截断)' : output;
      return this.success(`$ ${command}\n${trimmed}`);
    } catch (err: any) {
      const stderr = err.stderr?.toString() || '';
      const stdout = err.stdout?.toString() || '';
      return this.error(`命令失败 (exit ${err.status}):\n${stdout}\n${stderr}`.trim());
    }
  }
}
