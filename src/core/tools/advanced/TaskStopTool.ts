import { z } from 'zod';
import { ZodTool, ToolContext } from './ZodTool.js';
import { AgentTool } from './AgentTool.js';
import { ToolCategory } from '../../../types/tool.js';

export class TaskStopTool extends ZodTool<z.ZodObject<{ task_id: z.ZodString }>> {
  name = 'TaskStop';
  category: ToolCategory = 'system';
  description = '终止一个错误方向或挂起的子智能体。';
  requiresConfirmation = false;
  isDangerous = false;

  inputSchema = z.object({
    task_id: z.string().describe('AgentTool 返回的 task-id')
  });

  async call(args: { task_id: string }, context: ToolContext): Promise<string> {
    const { task_id } = args;
    const task = AgentTool.activeAgents.get(task_id);
    
    if (!task) {
      return `找不到任务: ${task_id}。请检查 task_id 是否正确。任务可能已经结束。`;
    }

    // In full implementation, send AbortSignal to the background promise.
    AgentTool.activeAgents.delete(task_id);

    return `
<task-notification>
<task-id>${task_id}</task-id>
<status>killed</status>
<summary>Agent "${task.desc}" was intentionally stopped.</summary>
</task-notification>
    `.trim();
  }

  get parameters() {
    return {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'ID of the task to kill' }
      },
      required: ['task_id']
    };
  }
}
