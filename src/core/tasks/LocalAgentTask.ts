export class LocalAgentTask {
  constructor(public agentName: string) {
    console.log(`[Task] Spawning background teammate agent: ${agentName}`);
  }
}
