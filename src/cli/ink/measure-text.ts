import stringWidth from 'string-width';

export function measureTextWidth(text: string): number {
  return stringWidth(text);
}

export function wrapText(text: string, maxWidth: number): string[] {
  // Simplified wrap text mock
  return [text];
}
