/**
 * 插件系统 — 动态加载外部工具和 Agent
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';
import { globalToolRegistry, BaseTool } from '../tools/base.js';
import { coordinator } from '../agents/Coordinator.js';
import { logger } from '../utils/logger.js';
import type { AgentConfig } from '../../types/config.js';
import type { JSONSchema, ToolExecutionContext, ToolExecutionResult } from '../../types/tool.js';

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author?: string;
  tools?: Array<{
    name: string;
    description: string;
    command: string;
    parameters: JSONSchema;
  }>;
  agents?: AgentConfig[];
}

/** 插件管理器 */
export class PluginManager {
  private plugins = new Map<string, PluginManifest>();
  private pluginDirs: string[] = [];

  constructor(dirs: string[] = []) {
    this.pluginDirs = dirs;
  }

  /** 加载目录下的所有插件 */
  loadAll(): number {
    let loaded = 0;
    for (const dir of this.pluginDirs) {
      if (!existsSync(dir)) continue;
      try {
        for (const entry of readdirSync(dir)) {
          const pluginDir = join(dir, entry);
          const manifestPath = join(pluginDir, 'plugin.json');
          if (existsSync(manifestPath)) {
            try {
              this.loadPlugin(pluginDir);
              loaded++;
            } catch (err: any) {
              logger.warn(`加载插件失败 ${entry}: ${err.message}`);
            }
          }
        }
      } catch {}
    }
    return loaded;
  }

  /** 加载单个插件 */
  loadPlugin(pluginDir: string): void {
    const manifestPath = join(pluginDir, 'plugin.json');
    const manifest: PluginManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

    if (this.plugins.has(manifest.name)) {
      logger.warn(`插件 "${manifest.name}" 已存在，跳过`);
      return;
    }

    // 注册工具
    if (manifest.tools) {
      for (const toolDef of manifest.tools) {
        const tool = new CommandTool(toolDef.name, toolDef.description, toolDef.command, toolDef.parameters, pluginDir);
        globalToolRegistry.register(tool);
      }
    }

    // 注册 Agent
    if (manifest.agents) {
      coordinator.registerAll(manifest.agents);
    }

    this.plugins.set(manifest.name, manifest);
    logger.info(`插件已加载: ${manifest.name} v${manifest.version}`);
  }

  /** 列出已加载的插件 */
  listPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values());
  }

  /** 获取插件数量 */
  get size(): number {
    return this.plugins.size;
  }
}

/** 命令行工具 — 插件通过 shell 命令实现的工具 */
class CommandTool extends BaseTool {
  name: string;
  description: string;
  category = 'custom' as const;
  parameters: JSONSchema;
  private command: string;
  private pluginDir: string;

  constructor(name: string, description: string, command: string, parameters: JSONSchema, pluginDir: string) {
    super();
    this.name = name;
    this.description = description;
    this.command = command;
    this.parameters = parameters;
    this.pluginDir = pluginDir;
  }

  async execute(args: Record<string, unknown>, ctx: ToolExecutionContext): Promise<ToolExecutionResult> {
    const { execSync } = await import('child_process');
    try {
      // 将参数注入命令模板
      let cmd = this.command;
      for (const [key, value] of Object.entries(args)) {
        cmd = cmd.replace(`{{${key}}}`, String(value));
      }
      const output = execSync(cmd, { cwd: this.pluginDir, encoding: 'utf-8', timeout: 30000 });
      return this.success(output);
    } catch (err: any) {
      return this.error(err.message);
    }
  }
}

/** 全局插件管理器 */
export const pluginManager = new PluginManager([
  resolve(process.cwd(), 'plugins'),
  resolve(process.cwd(), '.ycka', 'plugins'),
]);
