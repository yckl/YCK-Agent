import { runWithTeammateContext, getTeammateContext, TeammateContext } from '../../utils/teammateContext.js';
import { TeammateMailbox } from '../../utils/teammateMailbox.js';

export class AgentTool {
  public static async spawnInProcessTeammate(
    name: string, 
    teamName: string, 
    prompt: string, 
    agentType: string = 'general-purpose'
  ) {
    console.log(`[Leader] Spawning InProcess teammate: ${name}@${teamName} (Type: ${agentType})`);

    const ctx: TeammateContext = {
      id: `${name}@${teamName}`,
      name,
      teamName,
      backend: 'in-process',
      color: '#ff00ff', // default color
      cwd: process.cwd()
    };

    // Prepare initial prompt to the mailbox
    TeammateMailbox.writeToMailbox(teamName, name, {
      from: 'leader',
      text: prompt,
      type: 'text',
      summary: 'Initial Task'
    });

    // Fire and forget asynchronous execution in background
    setTimeout(() => {
       runWithTeammateContext(ctx, () => {
          this.workerAgentLoop();
       });
    }, 100);

    return `Agent ${name} spawned and actively running in background. Use SendMessage to communicate.`;
  }

  private static async workerAgentLoop() {
     const ctx = getTeammateContext();
     if (!ctx) return;
     console.log(`[Worker ${ctx.name}] Started worker loop...`);

     // True implementation will hook into the main QueryEngine `query()` infinite loop here
     // Polling for incoming messages:
     setInterval(() => {
        const msgs = TeammateMailbox.readUnreadMessages(ctx.teamName, ctx.name);
        msgs.forEach(m => {
            console.log(`[Worker ${ctx.name}] Received: ${m.text}`);
            if (m.type === 'shutdown_request') {
                console.log(`[Worker ${ctx.name}] Shutting down...`);
                // Break out of loop logic
                process.exit(0); // Mocking shutdown
            }
        });
     }, 1000);
  }
}
