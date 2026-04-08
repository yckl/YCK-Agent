export function evaluateAutoModeSafety(command: string): boolean {
  // Classifier to block dangerous commands like rm -rf /
  if (command.includes('rm -rf') && command.includes('/')) return false;
  return true;
}
