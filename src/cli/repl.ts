/**
 * YCK Agent - 交互式 REPL
 */
import * as readline from 'readline';
import chalk from 'chalk';
import ora from 'ora';
import { chatEngine } from '../core/query/QueryEngine.js';
import { getConfig, switchProvider, switchModel, getActiveModel } from '../core/config/index.js';
import { globalToolRegistry } from '../core/tools/index.js';
import type { Message, ToolCall } from '../types/message.js';

/** 启动交互式 REPL */
export async function startRepl(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green.bold('\n🤖 You: '),
  });

  const messages: Message[] = [];
  let isProcessing = false;

  rl.prompt();

  rl.on('line', async (input) => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing) {
      if (!isProcessing) rl.prompt();
      return;
    }

    // 处理斜杠命令
    if (trimmed.startsWith('/')) {
      handleSlashCommand(trimmed, messages, rl);
      rl.prompt();
      return;
    }

    isProcessing = true;

    // 添加用户消息
    messages.push({ role: 'user', content: trimmed, timestamp: Date.now() });

    // 流式输出
    const spinner = ora({ text: chalk.gray('思考中...'), spinner: 'dots' }).start();
    let firstToken = true;
    let fullContent = '';
    const toolCalls: ToolCall[] = [];
    let currentToolArgs = '';

    try {
      for await (const event of chatEngine.chat(messages, {
        systemPrompt: getConfig().systemPrompt,
      })) {
        switch (event.type) {
          case 'text_delta':
            if (firstToken) {
              spinner.stop();
              process.stdout.write(chalk.cyan.bold('\n🤖 Agent: '));
              firstToken = false;
            }
            process.stdout.write(event.content || '');
            fullContent += event.content || '';
            break;

          case 'thinking_delta':
            if (firstToken) {
              spinner.stop();
              firstToken = false;
            }
            // 显示思考过程（灰色）
            process.stdout.write(chalk.gray(event.content || ''));
            break;

          case 'tool_call_start':
            spinner.stop();
            if (firstToken) firstToken = false;
            console.log(chalk.yellow(`\n  🔧 调用工具: ${event.toolCall?.name}`));
            currentToolArgs = '';
            break;

          case 'tool_call_delta':
            currentToolArgs += event.content || '';
            break;

          case 'tool_call_end':
            if (event.toolCall?.id && event.toolCall?.name) {
              const tc: ToolCall = {
                id: event.toolCall.id,
                name: event.toolCall.name,
                arguments: (event.toolCall.arguments || {}) as Record<string, unknown>,
              };
              toolCalls.push(tc);

              // 执行工具
              const tool = globalToolRegistry.get(tc.name);
              if (tool) {
                const execSpinner = ora({ text: chalk.gray(`  执行 ${tc.name}...`), spinner: 'dots', indent: 4 }).start();
                try {
                  const result = await tool.execute(tc.arguments, { cwd: process.cwd() });
                  execSpinner.succeed(chalk.green(`  ${tc.name} 完成`));
                  
                  // 显示结果摘要
                  const preview = result.content.slice(0, 200);
                  console.log(chalk.gray(`    ${preview}${result.content.length > 200 ? '...' : ''}`));

                  // 添加工具结果到消息
                  messages.push({
                    role: 'assistant',
                    content: fullContent,
                    timestamp: Date.now(),
                    toolCalls: [tc],
                  });
                  messages.push({
                    role: 'tool',
                    content: result.content,
                    toolCallId: tc.id,
                    toolName: tc.name,
                    isError: result.isError,
                    timestamp: Date.now(),
                  });
                  fullContent = '';

                  // 继续让 AI 处理工具结果
                  const contSpinner = ora({ text: chalk.gray('处理结果...'), spinner: 'dots' }).start();
                  for await (const ev2 of chatEngine.chat(messages, {
                    systemPrompt: getConfig().systemPrompt,
                  })) {
                    if (ev2.type === 'text_delta') {
                      if (contSpinner.isSpinning) {
                        contSpinner.stop();
                        process.stdout.write(chalk.cyan.bold('\n🤖 Agent: '));
                      }
                      process.stdout.write(ev2.content || '');
                      fullContent += ev2.content || '';
                    }
                  }
                } catch (err: any) {
                  execSpinner.fail(chalk.red(`  ${tc.name} 失败: ${err.message}`));
                }
              }
            }
            break;

          case 'done':
            if (event.usage) {
              console.log(chalk.gray(`\n  📊 Tokens: ${event.usage.promptTokens} → ${event.usage.completionTokens} (${event.usage.totalTokens} total)`));
            }
            break;

          case 'error':
            spinner.stop();
            console.log(chalk.red(`\n  ❌ 错误: ${event.error}`));
            break;
        }
      }

      // 保存助手消息（如果有内容且没有被工具调用覆盖）
      if (fullContent && !toolCalls.length) {
        messages.push({
          role: 'assistant',
          content: fullContent,
          timestamp: Date.now(),
          model: getActiveModel(),
        });
      }

      console.log(); // 换行

    } catch (err: any) {
      spinner.stop();
      console.log(chalk.red(`\n❌ 错误: ${err.message}`));
    }

    isProcessing = false;
    rl.prompt();
  });

  rl.on('close', () => {
    console.log(chalk.gray('\n👋 再见！'));
    process.exit(0);
  });
}

/** 处理斜杠命令 */
function handleSlashCommand(cmd: string, messages: Message[], rl: readline.Interface): void {
  const parts = cmd.split(/\s+/);
  const command = parts[0]!.toLowerCase();
  const arg = parts.slice(1).join(' ');

  switch (command) {
    case '/help':
      console.log(chalk.cyan(`
  命令列表:
    ${chalk.green('/help')}              显示帮助
    ${chalk.green('/tools')}             列出可用工具
    ${chalk.green('/model <name>')}      切换模型
    ${chalk.green('/provider <name>')}   切换 Provider
    ${chalk.green('/clear')}             清空对话历史
    ${chalk.green('/history')}           查看对话历史
    ${chalk.green('/agent <name>')}      切换 Agent
    ${chalk.green('/agents')}            列出 Agent
    ${chalk.green('/status')}            显示状态
    ${chalk.green('/exit')}              退出
`));
      break;

    case '/tools':
      console.log(chalk.cyan.bold(`\n🛠️  可用工具 (${globalToolRegistry.size} 个)`));
      for (const cat of globalToolRegistry.getCategories()) {
        const tools = globalToolRegistry.getByCategory(cat);
        console.log(chalk.yellow(`  [${cat}]`));
        for (const t of tools) {
          console.log(chalk.white(`    ${t.name}`) + chalk.gray(` - ${t.description}`));
        }
      }
      break;

    case '/model':
      if (arg) {
        switchModel(arg);
        console.log(chalk.green(`✅ 模型已切换: ${arg}`));
      } else {
        console.log(chalk.gray(`当前模型: ${getActiveModel()}`));
      }
      break;

    case '/provider':
      if (arg) {
        try {
          switchProvider(arg);
          chatEngine.resetClients();
          console.log(chalk.green(`✅ Provider 已切换: ${arg}`));
        } catch (err: any) {
          console.log(chalk.red(`❌ ${err.message}`));
        }
      } else {
        console.log(chalk.gray(`当前 Provider: ${getConfig().activeProvider}`));
      }
      break;

    case '/clear':
      messages.length = 0;
      console.log(chalk.green('✅ 对话历史已清空'));
      break;

    case '/history':
      if (messages.length === 0) {
        console.log(chalk.gray('暂无对话历史'));
      } else {
        for (const msg of messages.slice(-10)) {
          const role = msg.role === 'user' ? chalk.green('You') : chalk.cyan('Agent');
          const preview = msg.content.slice(0, 100);
          console.log(`  ${role}: ${preview}${msg.content.length > 100 ? '...' : ''}`);
        }
      }
      break;

    case '/status':
      const cfg = getConfig();
      console.log(chalk.cyan(`
  Provider: ${chalk.white(cfg.activeProvider)}
  Model:    ${chalk.white(getActiveModel())}
  Tools:    ${chalk.white(String(globalToolRegistry.size))}
  Messages: ${chalk.white(String(messages.length))}
  Theme:    ${chalk.white(cfg.theme)}
`));
      break;

    case '/exit':
    case '/quit':
    case '/q':
      console.log(chalk.gray('👋 再见！'));
      process.exit(0);

    default:
      console.log(chalk.yellow(`未知命令: ${command}。输入 /help 查看帮助。`));
  }
}
