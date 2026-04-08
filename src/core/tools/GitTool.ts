/**
 * Git 操作工具
 */
import { execSync } from 'child_process';
import { BaseTool } from './base.js';
import type { JSONSchema, ToolExecutionContext, ToolExecutionResult } from '../../types/tool.js';

export class GitTool extends BaseTool {
  name = 'git';
  description = '执行 Git 操作：查看状态、提交、分支管理、查看 diff、日志等。';
  category = 'devops' as const;
  requiresConfirmation = true;
  parameters: JSONSchema = {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'Git 子命令，如 status, diff, log, add, commit, branch, checkout 等' },
      args: { type: 'string', description: '附加参数' },
    },
    required: ['command'],
  };

  private readonly SAFE_COMMANDS = ['status', 'diff', 'log', 'branch', 'show', 'blame', 'ls-files', 'remote', 'tag', 'stash list'];
  private readonly DANGEROUS_COMMANDS = ['push', 'reset --hard', 'clean -fd', 'rebase', 'force'];

  async execute(args: Record<string, unknown>, ctx: ToolExecutionContext): Promise<ToolExecutionResult> {
    const command = args.command as string;
    const extraArgs = (args.args as string) || '';

    if (this.DANGEROUS_COMMANDS.some(d => `${command} ${extraArgs}`.includes(d))) {
      return this.error(`危险操作: git ${command} ${extraArgs}。请手动执行此命令。`);
    }

    try {
      const fullCmd = `git ${command} ${extraArgs}`.trim();
      const output = execSync(fullCmd, { cwd: ctx.cwd, encoding: 'utf-8', timeout: 15000 });
      const trimmed = output.length > 30000 ? output.slice(0, 30000) + '\n...(截断)' : output;
      return this.success(`$ ${fullCmd}\n${trimmed || '(无输出)'}`);
    } catch (err: any) {
      return this.error(`git ${command} 失败: ${err.stderr || err.message}`);
    }
  }
}
