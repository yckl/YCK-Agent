/**
 * Docker 操作工具
 */
import { execSync } from 'child_process';
import { BaseTool } from './base.js';
import type { JSONSchema, ToolExecutionContext, ToolExecutionResult } from '../../types/tool.js';

export class DockerTool extends BaseTool {
  name = 'docker';
  description = '执行 Docker 操作：查看容器/镜像、构建、启动/停止容器、查看日志等。';
  category = 'devops' as const;
  requiresConfirmation = true;
  isDangerous = true;
  parameters: JSONSchema = {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'Docker 命令，如 ps, images, build, logs, exec 等' },
      args: { type: 'string', description: '附加参数' },
    },
    required: ['command'],
  };

  async execute(args: Record<string, unknown>, ctx: ToolExecutionContext): Promise<ToolExecutionResult> {
    const command = args.command as string;
    const extraArgs = (args.args as string) || '';
    try {
      const fullCmd = `docker ${command} ${extraArgs}`.trim();
      const output = execSync(fullCmd, { cwd: ctx.cwd, encoding: 'utf-8', timeout: 60000 });
      return this.success(`$ ${fullCmd}\n${output || '(无输出)'}`);
    } catch (err: any) {
      return this.error(`docker ${command} 失败: ${err.stderr || err.message}`);
    }
  }
}
