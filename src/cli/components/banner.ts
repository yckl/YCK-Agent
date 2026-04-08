/**
 * YCK Agent - 启动横幅
 */
import chalk from 'chalk';
import { getConfig, getActiveModel } from '../../core/config/index.js';
import { globalToolRegistry } from '../../core/tools/index.js';

export function showBanner(): void {
  const config = getConfig();
  const cwd = process.cwd();
  
  // Custom orange typically used in Claude CLI for the block
  const orange = chalk.hex('#D77757');
  
  const banner = `
${orange('■ ■')}    YCK-Agent v1.0.0
${orange('█████')}  ${config.activeProvider} · ${config.activeModel}
${orange('█████')}  ${cwd}
${orange('█ █ █')}
`;
  console.log(banner);
}
