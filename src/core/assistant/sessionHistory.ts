import { Message } from '../../types/message.js';
import { trackTokenBudget } from '../query/tokenBudget.js';

export class SessionHistoryManager {
  private history: Message[] = [];

  public append(msg: Message) {
    this.history.push(msg);
    // Trigger lazy pruning if necessary
    if (this.history.length > 50) {
      this.pruneHistory();
    }
  }

  public getContext(): Message[] {
    return this.history;
  }

  private pruneHistory() {
    console.log('[Assistant] Pruning session history to conserve token bounds...');
    // Replace oldest queries with a summarization block
    this.history = this.history.slice(this.history.length - 20);
  }
}
