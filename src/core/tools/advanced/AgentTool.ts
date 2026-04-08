import { z } from 'zod';
import { ZodTool, ToolContext } from './ZodTool.js';
import { randomUUID } from 'crypto';
import { ToolCategory } from '../../../types/tool.js';

export class AgentTool extends ZodTool<z.ZodObject<{ prompt: z.ZodString; description: z.ZodString }>> {
  name = 'Agent';
  category: ToolCategory = 'system';
  description = '启动一个新的子智能体 (Sub-agent) 并行执行独立任务。子智能体可在后台独立思考、使用工具并最终返回结果报告。非常适合指派深度的代码分析、文件编辑或并行研究任务。';
  requiresConfirmation = false;
  isDangerous = false;

  inputSchema = z.object({
    description: z.string().describe('任务的简短描述，例如 "Research auth bug"'),
    prompt: z.string().describe('给子智能体的详尽指令。必须自包含，包含所有上下文、文件路径和具体要求。子智能体无法看到您的聊天记录。')
  });

  // 在真实系统中，这里会维护后台任务的实际运行状态
  static activeAgents = new Map<string, { desc: string, status: string }>();

  async call(args: { description: string, prompt: string }, context: ToolContext): Promise<string> {
    const taskId = `agent-${randomUUID().slice(0, 8)}`;
    AgentTool.activeAgents.set(taskId, { desc: args.description, status: 'running' });
    
    // In a full implementation, we would spawn an actual background thread or async process
    // that creates a new AgentEngine with the `prompt` and runs until 'done'.
    // For now, this returns the structure Claude coordinator expects so the model knows it started.
    return `
Sub-agent successfully launched in background.
<task-id>${taskId}</task-id>
<status>running</status>
<summary>Agent "${args.description}" has started executing.</summary>
Please continue your work. You will be notified via a <task-notification> when this agent completes.
    `.trim();
  }

  get parameters() {
    return {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Brief description of task' },
        prompt: { type: 'string', description: 'Detailed prompt/instruction for the agent' }
      },
      required: ['description', 'prompt']
    };
  }
}
