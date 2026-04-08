import type { Message, UserMessage } from '../../types/message.js';
import { groupMessagesByApiRound } from './grouping.js';
import { BASE_COMPACT_PROMPT } from './prompt.js';
import { SessionMemoryCompact } from './sessionMemoryCompact.js';

export class AutoCompact {
  public static readonly MAX_FAILURES = 3;

  public static async executeMacro(messages: Message[], tokenCount: number): Promise<Message[]> {
    console.log('[Compact] Layer 5: Invoking LLM Auto-Compact Sequence...');

    // 1. First Attempt: Rapid Session Memory Compact 
    const smResult = SessionMemoryCompact.trySessionMemoryCompaction(messages, Math.max(0, messages.length - 30));
    if (smResult) {
       console.log('[Compact] Successfully used fast Session Memory path instead of expensive LLM Fork.');
       return smResult;
    }
    
    // 2. LLM Fork Agent Path (Full Compact)
    console.log('[Compact] Session Memory path bypassed. Preparing ForkAgent full summary...');
    console.log('Sending Prompt with strict tool-rejection PREAMBLE:', BASE_COMPACT_PROMPT.substring(0, 50) + '...');
    
    let groups = groupMessagesByApiRound(messages);
    
    // PTL (Prompt-Too-Long) Retry mechanism mocked: We drop 20% oldest groups if length > limit
    if (groups.length > 5) {
      console.log(`[Compact] PTL Retry: Dropping oldest API rounds to fit into context...`);
      groups = groups.slice(Math.floor(groups.length * 0.2));
    }
    
    const summaryStr = `[Generated LLM Summary]\n\n1. Intent: Resuming...\n\n[End of Summary]`;
    const cleanedSummary = this.formatCompactSummary(summaryStr);

    const summaryMsg: UserMessage = {
      role: 'user',
      content: cleanedSummary,
      timestamp: Date.now()
    };
    
    return [summaryMsg];
  }

  private static formatCompactSummary(summary: string): string {
    summary = summary.replace(/<analysis>[\s\S]*?<\/analysis>/, '');
    const match = summary.match(/<summary>([\s\S]*?)<\/summary>/);
    if (match) {
      summary = summary.replace(/<summary>[\s\S]*?<\/summary>/, `Summary:\n${match[1].trim()}`);
    }
    return summary.replace(/\n\n+/g, '\n\n').trim();
  }
}
