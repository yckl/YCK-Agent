/**
 * API Key 设置向导 — 自动打开浏览器获取 Key
 */

import chalk from 'chalk';
import { execSync } from 'child_process';
import * as readline from 'readline';
import { setApiKey, saveConfig, getConfig } from '../../core/config/index.js';

/** Provider 的 API Key 获取页面 */
const KEY_PAGES: Record<string, { url: string; prefix: string; name: string }> = {
  openai: {
    url: 'https://platform.openai.com/api-keys',
    prefix: 'sk-',
    name: 'OpenAI',
  },
  anthropic: {
    url: 'https://console.anthropic.com/settings/keys',
    prefix: 'sk-ant-',
    name: 'Anthropic',
  },
  deepseek: {
    url: 'https://platform.deepseek.com/api_keys',
    prefix: 'sk-',
    name: 'DeepSeek',
  },
};

/** 打开浏览器 */
function openBrowser(url: string): void {
  const platform = process.platform;
  try {
    if (platform === 'win32') {
      execSync(`start "" "${url}"`, { stdio: 'ignore' });
    } else if (platform === 'darwin') {
      execSync(`open "${url}"`, { stdio: 'ignore' });
    } else {
      execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
    }
  } catch {
    console.log(chalk.yellow(`  无法自动打开浏览器，请手动访问: ${url}`));
  }
}

/** API Key 设置向导 */
export async function setupApiKey(provider?: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const ask = (question: string): Promise<string> =>
    new Promise(resolve => rl.question(question, resolve));

  try {
    // 如果没指定 provider，让用户选择
    if (!provider) {
      console.log(chalk.cyan.bold('\n🔑 API Key 设置向导\n'));
      console.log(chalk.white('  选择 Provider:'));
      console.log(chalk.green('  1.') + ' OpenAI (GPT-4o, GPT-4o-mini)');
      console.log(chalk.green('  2.') + ' Anthropic (Claude Sonnet, Claude Opus)');
      console.log(chalk.green('  3.') + ' DeepSeek (DeepSeek-Chat)');
      console.log(chalk.green('  4.') + ' 全部设置');
      console.log();

      const choice = await ask(chalk.yellow('  请选择 (1-4): '));
      const providers = ['openai', 'anthropic', 'deepseek'];
      if (choice === '4') {
        for (const p of providers) {
          await setupSingleProvider(p, ask);
        }
        rl.close();
        return true;
      }
      provider = providers[parseInt(choice) - 1] || 'openai';
    }

    await setupSingleProvider(provider, ask);
    rl.close();
    return true;

  } catch {
    rl.close();
    return false;
  }
}

/** 设置单个 Provider 的 Key */
async function setupSingleProvider(
  provider: string,
  ask: (q: string) => Promise<string>
): Promise<void> {
  const info = KEY_PAGES[provider];
  if (!info) {
    console.log(chalk.red(`  未知 Provider: ${provider}`));
    return;
  }

  console.log(chalk.cyan(`\n  📡 设置 ${info.name} API Key`));
  console.log(chalk.gray(`  正在打开 ${info.url} ...`));

  // 打开浏览器
  openBrowser(info.url);

  console.log(chalk.yellow(`\n  请在浏览器中：`));
  console.log(chalk.white(`  1. 登录你的 ${info.name} 账号`));
  console.log(chalk.white(`  2. 创建一个新的 API Key`));
  console.log(chalk.white(`  3. 复制 Key 粘贴到下面\n`));

  const key = await ask(chalk.green(`  请粘贴 ${info.name} API Key: `));
  const trimmedKey = key.trim();

  if (!trimmedKey) {
    console.log(chalk.yellow('  已跳过'));
    return;
  }

  // 验证 key 格式
  if (info.prefix && !trimmedKey.startsWith(info.prefix)) {
    console.log(chalk.yellow(`  ⚠️ Key 格式可能不正确（通常以 ${info.prefix} 开头），但仍会保存`));
  }

  // 保存
  setApiKey(provider, trimmedKey);
  console.log(chalk.green(`  ✅ ${info.name} API Key 已保存！`));

  // 设为默认 provider
  const setDefault = await ask(chalk.yellow(`  设为默认 Provider? (Y/n): `));
  if (!setDefault || setDefault.toLowerCase() === 'y') {
    const cfg = getConfig();
    cfg.activeProvider = provider;
    saveConfig(cfg);
    console.log(chalk.green(`  ✅ 默认 Provider 已设为 ${info.name}`));
  }
}

/** 快速检查是否已配置 Key，未配置则启动向导 */
export async function ensureApiKey(): Promise<boolean> {
  const cfg = getConfig();
  const provider = cfg.providers[cfg.activeProvider];

  if (provider?.apiKey) {
    return true; // 已有 key
  }

  console.log(chalk.yellow(`\n  ⚠️ ${cfg.activeProvider} 的 API Key 未设置`));
  console.log(chalk.gray('  首次使用需要设置 API Key\n'));

  return await setupApiKey(cfg.activeProvider);
}
