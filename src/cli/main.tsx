#!/usr/bin/env node
/**
 * YCK Agent - Main Entrypoint Orchestrator
 */
import { Command } from 'commander';
import { runEnvironmentChecks, checkDebuggerInjection } from './setup.js';
import { runCliMode } from './entrypoints/cli.js';
import { runMcpMode } from './entrypoints/mcp.js';
import { runPrintMode } from './print.js';
import { runConfigCommand } from './commands/config.js';
import { runToolsCommand } from './commands/tools.js';
import { runCommitCommand } from './commands/commit.js';
import { runReviewCommand } from './commands/review.js';
import { setupApiKey } from './commands/setup.js';
import { loadConfig } from '../core/config/index.js';

// BIOS: Core hardware/environment checks before booting
runEnvironmentChecks();
checkDebuggerInjection();

const program = new Command();

program
  .name('ycka')
  .description('YCK Agent - 全能 AI 智能体系统 (Claude Architecture)')
  .version('1.0.0');

// TUI / Core Entrypoint
program
  .argument('[prompt]', '直接发送消息')
  .option('-m, --model <model>', '指定模型')
  .option('-p, --provider <provider>', '指定 Provider (openai/anthropic/deepseek)')
  .option('-c, --config <path>', '指定配置文件路径')
  .option('--no-tools', '禁用工具')
  .option('--print', 'Headless Print 无头输出模式')
  .action(async (prompt, opts) => {
    // Check if cc:// deep link was passed
    if (prompt && prompt.startsWith('cc://')) {
      console.log('[System] Intercepted protocol link.');
      return;
    }
    
    // Fork based on headless mode
    if (opts.print) {
      await runPrintMode(prompt, opts);
      return;
    }

    // Default TUI mode
    await runCliMode(prompt, opts);
  });

// Setup (Auth)
program
  .command('setup')
  .description('🔑 设置 API Key（自动打开浏览器授权页面）')
  .argument('[provider]', 'Provider 名称')
  .action(async (provider) => {
    loadConfig();
    await setupApiKey(provider);
  });

// Config Panel
program
  .command('config')
  .description('管理配置')
  .option('--set-key <provider> <key>', '设置 API Key')
  .option('--provider <name>', '切换 Provider')
  .option('--model <name>', '切换模型')
  .option('--show', '显示当前配置')
  .action(runConfigCommand);

// Tools Review
program
  .command('tools')
  .description('列出可用工具')
  .action(runToolsCommand);

// Extended Auto Macros
program
  .command('commit')
  .description('✨ 宏指令：由 AI 自动生成 Git Commit')
  .action(runCommitCommand);

program
  .command('review')
  .description('🔍 宏指令：对当前变更进行 Code Review')
  .action(runReviewCommand);

// MCP Mode
program
  .command('mcp')
  .description('🔌 以 MCP 协议作为后端服务运行')
  .action(runMcpMode);

program.parse();
