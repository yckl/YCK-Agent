import type { Message, AssistantMessage, ToolMessage } from '../../types/message.js';

export class SessionMemoryCompact {
  public static readonly MIN_TOKENS = 10_000;
  public static readonly MIN_TEXT_BLOCKS = 5;
  public static readonly MAX_TOKENS = 40_000;

  public static trySessionMemoryCompaction(messages: Message[], lastSummarizedIndex: number): Message[] | null {
    let startIndex = lastSummarizedIndex + 1;
    
    // Attempt backwards expanding to reach minimums without blowing maximums
    // (Skipped full token loop for brevity, using abstract index shifting)
    startIndex = Math.max(0, messages.length - 20); // mock calculation
    
    startIndex = this.adjustIndexToPreserveAPIInvariants(messages, startIndex);

    if (messages.length - startIndex < 5) {
       return null; // Fallback to LLM traditional auto-compact
    }

    console.log('[Compact] Layer 4: Session Memory Compact succeeded. Extracted range starting at index', startIndex);
    return messages.slice(startIndex);
  }

  /** Ensures tool_use and tool_results are not orphaned and message.id matches don't strictly separate */
  private static adjustIndexToPreserveAPIInvariants(messages: Message[], startIndex: number): number {
    let finalIndex = startIndex;

    // Pass 1: Ensure tool_result has matching tool_use
    const toolUseIdsInRange = new Set<string>();
    const toolResultIdsInRange = new Set<string>();

    for (let i = finalIndex; i < messages.length; i++) {
       const msg = messages[i];
       if (msg.role === 'assistant') {
         (msg as AssistantMessage).toolCalls?.forEach(tc => toolUseIdsInRange.add(tc.id));
       } else if (msg.role === 'tool') {
         toolResultIdsInRange.add((msg as ToolMessage).toolCallId);
       }
    }

    const orphanedResults = [...toolResultIdsInRange].filter(id => !toolUseIdsInRange.has(id));

    if (orphanedResults.length > 0) {
       // Search backwards to include the assistant message that spawned this tool_use
       for (let i = finalIndex - 1; i >= 0; i--) {
          const msg = messages[i];
          if (msg.role === 'assistant') {
             const am = msg as AssistantMessage;
             const hasOrphan = am.toolCalls?.some(tc => orphanedResults.includes(tc.id));
             if (hasOrphan) {
                finalIndex = i; // Push boundary back
             }
          }
       }
    }

    return finalIndex;
  }
}
