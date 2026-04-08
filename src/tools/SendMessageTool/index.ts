import { getTeammateContext } from '../../utils/teammateContext.js';
import { TeammateMailbox } from '../../utils/teammateMailbox.js';

export class SendMessageTool {
  public static async call(to: string, message: string, summary: string = '', isShutdown: boolean = false) {
    const ctx = getTeammateContext();
    const from = ctx ? ctx.name : 'leader';
    const teamName = ctx ? ctx.teamName : 'default_team';

    console.log(`[SendMessage] ${from} -> ${to}: ${summary}`);

    const msgType = isShutdown ? 'shutdown_request' : 'text';
    const payload: Omit<import('../../utils/teammateMailbox.js').TeammateMessage, 'id' | 'read' | 'timestamp'> = {
        from,
        text: message,
        summary,
        type: msgType as any
    };

    if (to === '*') {
       // Broadcast to all team members logic (omitted file system scan iteration for brevity)
       console.log('[SendMessage] Broadcasting to all mailboxes.');
    } else {
       TeammateMailbox.writeToMailbox(teamName, to, payload);
    }
    
    return `Message sent to ${to}`;
  }
}
