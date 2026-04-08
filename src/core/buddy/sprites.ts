import { trackTokenBudget } from '../query/tokenBudget.js';

export function getBuddyActivePromptModifier() {
  return "You are acting as a Companion Sprite. Monitor the user's intent and offer short, witty validations or warnings when necessary.";
}

export function detectEnvironmentAnomalies() {
  // Proactively check process execution errors to inject into buddy prompt
  return [];
}
