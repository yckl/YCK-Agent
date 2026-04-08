/**
 * 日志系统
 */
import { mkdirSync, appendFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { homedir } from 'os';

const LOG_DIR = resolve(homedir(), '.ycka', 'logs');

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

let _logLevel: LogLevel = 'info';
const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export function setLogLevel(level: LogLevel): void {
  _logLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[_logLevel];
}

function writeLog(level: LogLevel, message: string, data?: unknown): void {
  if (!shouldLog(level)) return;

  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`;

  // 写入文件
  try {
    if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
    const logFile = resolve(LOG_DIR, `${new Date().toISOString().slice(0, 10)}.log`);
    appendFileSync(logFile, line + '\n', 'utf-8');
  } catch {}

  // debug 级别也输出到 stderr
  if (level === 'error') {
    console.error(line);
  }
}

export const logger = {
  debug: (msg: string, data?: unknown) => writeLog('debug', msg, data),
  info: (msg: string, data?: unknown) => writeLog('info', msg, data),
  warn: (msg: string, data?: unknown) => writeLog('warn', msg, data),
  error: (msg: string, data?: unknown) => writeLog('error', msg, data),
};
