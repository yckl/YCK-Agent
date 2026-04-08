import React from 'react';
import { render } from 'ink';
import chalk from 'chalk';
import { loadConfig, switchProvider, switchModel } from '../../core/config/index.js';
import { registerBuiltinTools } from '../../core/tools/index.js';
import { ensureApiKey } from '../commands/setup.js';
import { gracefulExit } from '../exit.js';
import { launchRepl } from '../launchers/replLauncher.js';
import { showBanner } from '../components/banner.js';

export async function runCliMode(prompt: string, opts: any) {
  // 调用横幅展示
  showBanner();

  // 加载配置
  loadConfig(opts.config);
  if (opts.provider) switchProvider(opts.provider);
  if (opts.model) switchModel(opts.model);

  // 注册工具
  registerBuiltinTools();

  // 首次使用检查 API Key，自动打开浏览器授权
  const hasKey = await ensureApiKey();
  if (!hasKey) {
    console.log(chalk.red('\\n❌ 未设置 API Key，无法继续。请运行: ycka setup'));
    gracefulExit(1);
  }

  // Delegate execution to isolated Launcher
  await launchRepl(prompt);
}
