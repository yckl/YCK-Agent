import type { QueryLoopState } from '../../types/message.js';
import { ContextCollapse } from './contextCollapse.js';

export class ErrorRecoveryCascade {
  public static handleApiRejection(error: Error, state: QueryLoopState) {
    const msg = error.message.toLowerCase();
    
    if (msg.includes('prompt_too_long') || msg.includes('413') || msg.includes('payload too large')) {
      console.log('[Compact] Layer 6/7: Cascade Error Recovery triggered for 413/PTL.');
      
      // L1: Drain context collapse logs
      if (state.transition !== 'collapse_drain_retry') {
        ContextCollapse.recoverFromOverflow();
        state.transition = 'collapse_drain_retry';
        return;
      }

      // L2: Reactive Compact (Full LLM Summary)
      if (!state.hasAttemptedReactiveCompact) {
        state.hasAttemptedReactiveCompact = true;
        state.transition = 'reactive_compact_retry';
        // AutoCompact logic would fire in next loop
        return;
      }

      // L3: Max Output Escalate
      if (!state.maxOutputTokensOverride) {
         state.maxOutputTokensOverride = true;
         state.transition = 'max_output_tokens_escalate';
         return;
      }

      // L4: Multi-turn Nudge Recovery
      if (state.maxOutputTokensRecoveryCount < 3) {
         state.maxOutputTokensRecoveryCount++;
         state.messages.push({
           role: 'user',
           content: 'Please continue your response, you were cut off due to length limits.',
           timestamp: Date.now()
         } as any);
         state.transition = 'max_output_tokens_recovery';
         return;
      }

      // L5: Model fallback 
      console.error('[ErrorRecovery] All 5 layers of fallback exhausted. Giving up.');
    }
    
    // Throw if not recoverable
    throw error;
  }
}
