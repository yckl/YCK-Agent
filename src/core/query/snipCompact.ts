import type { Message, ToolMessage } from '../../types/message.js';

export class SnipCompact {
  public static readonly SNIP_THRESHOLD = 300_000;
  
  public static executeSnip(messages: Message[]): { newMessages: Message[], snipTokensFreed: number } {
    let rawLength = JSON.stringify(messages).length;
    if (rawLength < this.SNIP_THRESHOLD) {
      return { newMessages: messages, snipTokensFreed: 0 };
    }

    console.log('[Compact] Layer 2: Fast history snip due to threshold breach.');
    // Keep first 5 (sys/init) and last 10
    const startPreserved = messages.slice(0, 5);
    const endPreserved = messages.slice(messages.length - 10);
    const snipedArea = messages.slice(5, messages.length - 10);
    
    // Estimate sniped tokens (4 chars/token roughly)
    const snipTokensFreed = Math.floor(JSON.stringify(snipedArea).length / 4);

    return { 
      newMessages: [...startPreserved, ...endPreserved], 
      snipTokensFreed 
    };
  }
}
