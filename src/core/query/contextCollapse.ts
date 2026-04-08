import type { Message } from '../../types/message.js';

// CQRS style commit store for collapses
const collapseCommits: Map<string, Message[]> = new Map();

export class ContextCollapse {
  public static readonly WINDOW_WARNING_RATIO = 0.90; // 90%
  private static currentRunId = Date.now().toString();

  public static applyCollapsesIfNeeded(messages: Message[]): Message[] {
    // Check if we approach 90% of hypothetical typical max (e.g. 100K out of 110K limit)
    // The projection relies on replacing past middle sections
    let totalLen = JSON.stringify(messages).length;
    if (totalLen < 150_000) return messages; // Not pressured

    console.log('[Compact] Layer 4: High pressure detected. Building CQRS collapsed projection.');
    
    const projectedView = [...messages];
    // Simple naive projection: collapse everything but last 20 messages into a single summary block
    if (projectedView.length > 30) {
      const boundaryMsg: Message = {
        role: 'system',
        content: `[System]: ${projectedView.length - 20} older messages were collapsed into commit store for brevity.`,
        timestamp: Date.now()
      };
      const recent = projectedView.slice(projectedView.length - 20);
      collapseCommits.set(this.currentRunId, projectedView.slice(0, projectedView.length - 20));
      return [boundaryMsg, ...recent];
    }
    
    return projectedView;
  }

  public static recoverFromOverflow() {
    console.log('[Compact] Recovery: Draining uncommitted collapse logs...');
    collapseCommits.delete(this.currentRunId);
  }
}
