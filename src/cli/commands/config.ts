import chalk from 'chalk';
import { loadConfig, getConfig } from '../../core/config/index.js';

export function runConfigCommand(opts: any) {
  loadConfig();
  if (opts.show) {
    const cfg = getConfig();
    console.log(chalk.cyan('当前配置:'));
    console.log(chalk.gray(`  Provider: ${chalk.white(cfg.activeProvider)}`));
    console.log(chalk.gray(`  Model: ${chalk.white(cfg.activeModel)}`));
    console.log(chalk.gray(`  Theme: ${chalk.white(cfg.theme)}`));
    const providers = Object.entries(cfg.providers);
    for (const [name, p] of providers) {
      const hasKey = p.apiKey ? '✅' : '❌';
      console.log(chalk.gray(`  ${name}: ${hasKey} ${p.models.default}`));
    }
  }
}
