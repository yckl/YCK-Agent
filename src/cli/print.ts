export async function runPrintMode(prompt: string, opts: any) {
  // Headless output mode
  console.log(`[Headless Mode] Executing prompt: ${prompt}`);
  // Execute via engine without TUI
  try {
     console.log(JSON.stringify({
       status: 'success',
       output: 'Mock headless output payload for pipe interoperability.'
     }));
  } catch (error) {
     console.error(JSON.stringify({ status: 'error', reason: String(error) }));
     process.exit(1);
  }
}
