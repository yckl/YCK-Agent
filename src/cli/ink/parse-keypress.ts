export function parseKeypress(chunk: Buffer) {
  // Mock implementations for raw terminal sequences 
  // e.g. converting chunk to 'up', 'down', 'ctrl+c'
  return { name: 'unknown', ctrl: false };
}
