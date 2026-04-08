export class TokenBudgetTracker {
  constructor(
    private totalBudget: number,
    private consumed: number = 0,
    private consecutiveContinuation: number = 0,
    private lastIncrease: number = 0
  ) {}

  public trackConsumption(promptTokens: number, completionTokens: number) {
    const total = promptTokens + completionTokens;
    this.consumed = total;
  }

  public shouldContinue(): boolean {
    // Continue if output budget < 90%
    return this.consumed < (this.totalBudget * 0.9);
  }

  public checkDecliningReturn(increments: number): boolean {
    this.consecutiveContinuation++;
    this.lastIncrease = increments;
    // Decrement detection: 3+ continuations && < 500 tokens
    if (this.consecutiveContinuation >= 3 && this.lastIncrease < 500) {
      console.warn('[Budget Tracker] Declining return detected. Halting auto-continuation.');
      return false;
    }
    return true;
  }

  public static estimatePromptCost(tokens: number): number {
    return (tokens / 1000) * 0.003;
  }
}

export function trackTokenBudget(prompt: number, comp: number) {
  return new TokenBudgetTracker(100_000).trackConsumption(prompt, comp);
}

export function estimatePromptCost(tokens: number) {
  return TokenBudgetTracker.estimatePromptCost(tokens);
}
