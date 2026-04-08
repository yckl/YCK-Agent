export function enforceClaudeAiLimits(cost: number) {
  if (cost > 50) {
    throw new Error('Claude Limits: Hard cap reached.');
  }
}
