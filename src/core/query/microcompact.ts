import type { Message, ToolMessage } from '../../types/message.js';

export interface CacheEditsBlock {
  toolResultIdsToDelete: string[];
}

export class Microcompact {
  public static readonly COMPACTABLE_TOOLS = new Set([
    'Read', 'Bash', 'Grep', 'Glob', 'WebSearch', 'WebFetch', 'Edit', 'Write'
  ]);

  private static pendingCacheEdits: CacheEditsBlock | null = null;
  public static readonly TTL_MS = 60 * 60 * 1000;
  private static lastAssistantMsgTime = Date.now();

  // Cached MC state path (Sub-path B)
  public static executeCachedMC(messages: Message[]): CacheEditsBlock | null {
    const idsToDelete: string[] = [];
    let toolResultCount = 0;

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i] as ToolMessage;
      if (msg.role === 'tool' && this.COMPACTABLE_TOOLS.has(msg.toolName)) {
        toolResultCount++;
        if (toolResultCount > 5) {
          idsToDelete.push(msg.toolCallId); // Mark for API cache erasure
        }
      }
    }

    if (idsToDelete.length > 0) {
      this.pendingCacheEdits = { toolResultIdsToDelete: idsToDelete };
      return this.pendingCacheEdits;
    }
    return null;
  }

  // Time-based TTL path (Sub-path A)
  public static execute(messages: Message[]): Message[] {
    const now = Date.now();
    const timeSinceLast = now - this.lastAssistantMsgTime;
    
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      this.lastAssistantMsgTime = now;
    }

    if (timeSinceLast > this.TTL_MS) {
      console.log('[Compact] Layer 3a: Cache TTL expired. Mutating local tool results...');
      let toolResultCount = 0;
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.role === 'tool') {
          toolResultCount++;
          if (toolResultCount > 5) {
            msg.content = '[Old tool result content cleared]';
          }
        }
      }
    } else {
      // Sub-path B: local messages kept immutable, but we extract cache edits for the API
      this.executeCachedMC(messages);
      if (this.pendingCacheEdits) {
        console.log(`[Compact] Layer 3b: Cached MC marked ${this.pendingCacheEdits.toolResultIdsToDelete.length} tool results for API erasure. Local messages kept intact!`);
      }
    }
    
    return messages;
  }
}
