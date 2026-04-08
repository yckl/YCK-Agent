import React from 'react';
import { render } from 'ink';
import chalk from 'chalk';
import { REPL } from '../screens/REPL.js';
import { ThemeProvider } from '../components/design-system/index.js';
import { gracefulExit } from '../exit.js';

export async function launchRepl(prompt?: string) {
  // 隔离的挂载环境，处理各种前置依赖同步获取工作
  try {
    const { waitUntilExit } = render(
      <ThemeProvider>
        <REPL 
          initialMessage={prompt} 
          exitTerminal={() => gracefulExit(0)} 
        />
      </ThemeProvider>
    );
    await waitUntilExit();
  } catch (error) {
    console.error(chalk.red('\\n[Fatal] REPL crashed: '), error);
    gracefulExit(1);
  }
}
