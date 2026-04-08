import { TeammateMailbox } from '../teammateMailbox.js';
import { getTeammateContext } from '../teammateContext.js';

export interface SwarmPermissionRequest {
  id: string;
  workerId: string;
  workerName: string;
  toolName: string;
  toolUseId: string;
  description: string;
  input: any;
  status: 'pending' | 'approved' | 'rejected';
  resolvedBy?: string;
  feedback?: string;
}

export class PermissionSync {
  
  /**
   * Called by a worker to request permission for a tool.
   * Blocks/polls until leader resolves the mailbox message.
   */
  public static async requestPermissionFromLeader(toolName: string, input: any, description: string): Promise<boolean> {
    const ctx = getTeammateContext();
    if (!ctx) return true; // Leader automatically self-approves here (or uses standard CLI prompts)

    const reqId = `perm_${Math.random().toString(36).substring(7)}`;
    
    // Send to leader inbox
    TeammateMailbox.writeToMailbox(ctx.teamName, 'leader', {
       from: ctx.name,
       text: 'Waiting for permission',
       type: 'permission_request',
       payload: {
           id: reqId,
           workerId: ctx.id,
           workerName: ctx.name,
           toolName,
           toolUseId: 'n/a',
           description,
           input,
           status: 'pending'
       } as SwarmPermissionRequest
    });

    console.log(`[Worker ${ctx.name}] Waiting for leader approval for tool ${toolName}...`);
    
    // Polling loop to wait for response
    return new Promise(resolve => {
        const interval = setInterval(() => {
           const messages = TeammateMailbox.readUnreadMessages(ctx.teamName, ctx.name);
           const response = messages.find(m => m.type === 'permission_response' && m.payload?.id === reqId);
           if (response) {
               clearInterval(interval);
               resolve(response.payload.status === 'approved');
           }
        }, 500);
    });
  }
}
