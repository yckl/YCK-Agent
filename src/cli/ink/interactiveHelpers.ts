import process from 'node:process';

export function hideCursor() {
  process.stdout.write('\\x1B[?25l');
}

export function showCursor() {
  process.stdout.write('\\x1B[?25h');
}

export function clearTerminal() {
  process.stdout.write('\\x1Bc');
}
