import chalk from 'chalk';
import { loadConfig } from '../../core/config/index.js';
import { registerBuiltinTools, globalToolRegistry } from '../../core/tools/index.js';

export function runToolsCommand() {
  loadConfig();
  registerBuiltinTools();
  console.log(chalk.cyan.bold(`\\n🛠️  可用工具 (${globalToolRegistry.size} 个)\\n`));
  for (const cat of globalToolRegistry.getCategories()) {
    const tools = globalToolRegistry.getByCategory(cat);
    console.log(chalk.yellow(`  [${cat}]`));
    for (const t of tools) {
      const flags = [
        t.requiresConfirmation ? '🔒' : '',
        t.isDangerous ? '⚠️' : '',
      ].filter(Boolean).join(' ');
      console.log(chalk.white(`    ${t.name}`) + chalk.gray(` - ${t.description} ${flags}`));
    }
  }
  console.log();
}
