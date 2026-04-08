import { z } from 'zod';
import { ZodTool, ToolContext } from './ZodTool.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ToolCategory } from '../../../types/tool.js';

const execAsync = promisify(exec);

export class ShellTool extends ZodTool<z.ZodObject<{ command: z.ZodString }>> {
  name = 'Bash';
  category: ToolCategory = 'system';
  description = '执行终端命令。可在当前工作流引擎或沙箱内进行操作系统交互、环境获取与执行复杂任务。';
  isDangerous = true;
  requiresConfirmation = true;

  inputSchema = z.object({
    command: z.string().describe('需要执行的 Bash 命令')
  });

  async call(args: { command: string }, context: ToolContext): Promise<string> {
    const { command } = args;
    try {
      const { stdout, stderr } = await execAsync(command, { cwd: context.cwd });
      return (stdout + (stderr ? `\nErrors:\n${stderr}` : '')).trim() || 'Command executed successfully (no output).';
    } catch (e: any) {
      return `执行失败 Error: ${e.message}\n${e.stdout}\n${e.stderr}`;
    }
  }

  // override
  get parameters() {
    return {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Bash command to execute' }
      },
      required: ['command']
    };
  }
}
