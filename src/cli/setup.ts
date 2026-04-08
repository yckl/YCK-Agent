import process from 'node:process';

export function runEnvironmentChecks() {
  const nodeMajVersion = parseInt(process.versions.node.split('.')[0], 10);
  if (nodeMajVersion < 18) {
    console.error('❌ YCK-Agent 需要 Node.js 18 或更高版本。');
    process.exit(1);
  }
  
  if (process.getuid && process.getuid() === 0 && !process.env.YCK_ALLOW_ROOT) {
    console.error('❌ 出于安全考虑，禁止以 Root/Sudo 运行 YCK-Agent。请设置 YCK_ALLOW_ROOT=1 极度危险地跳过这步。');
    process.exit(1);
  }
}

export function checkDebuggerInjection() {
  const isDebug = process.execArgv.some(arg => arg.includes('--inspect') || arg.includes('--debug'));
  if (isDebug) {
    console.warn('⚠️ 警告: 检测到进程被注入 Debugger (--inspect)。系统可能会拒绝某些高权限动作。');
  }
}
