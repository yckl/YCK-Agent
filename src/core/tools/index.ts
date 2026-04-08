/**
 * 工具注册中心 - 注册所有内置工具
 */

import { globalToolRegistry } from './base.js';
import { FileReadTool } from './FileReadTool.js';
import { FileWriteTool } from './FileWriteTool.js';
import { FileEditTool } from './FileEditTool.js';
import { MultiEditTool } from './MultiEditTool.js';
import { TerminalTool } from './TerminalTool.js';
import { GrepTool } from './GrepTool.js';
import { GlobTool } from './GlobTool.js';
import { ListDirTool } from './ListDirTool.js';
import { WebFetchTool } from './WebFetchTool.js';
import { GitTool } from './GitTool.js';
import { CodeAnalysisTool } from './CodeAnalysisTool.js';
import { DockerTool } from './DockerTool.js';
import { ApiTool } from './ApiTool.js';
import { ShellTool } from './advanced/ShellTool.js';
import { AgentTool } from './advanced/AgentTool.js';
import { TaskStopTool } from './advanced/TaskStopTool.js';

/** 注册所有内置工具 */
export function registerBuiltinTools(): void {
  globalToolRegistry.registerAll([
    // 文件操作
    new FileReadTool(),
    new FileWriteTool(),
    new FileEditTool(),
    new MultiEditTool(),
    // 终端
    new TerminalTool(),
    // 搜索
    new GrepTool(),
    new GlobTool(),
    // 文件系统
    new ListDirTool(),
    // 网络
    new WebFetchTool(),
    new ApiTool(),
    new CodeAnalysisTool(),
    // DevOps
    new GitTool(),
    new DockerTool(),
    // Advanced / Claude-like
    new ShellTool(),
    new AgentTool(),
    new TaskStopTool(),
  ]);
}

export { globalToolRegistry } from './base.js';
export { BaseTool } from './base.js';
