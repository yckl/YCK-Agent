import process from 'node:process';

export function gracefulExit(code: number = 0) {
  // Lifecycle cleanup hooks
  console.log('\\n[System] Performing graceful exit...');
  process.exit(code);
}
