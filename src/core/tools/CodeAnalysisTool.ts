/**
 * 代码分析工具 - 分析项目结构、文件统计、依赖关系
 */
import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, resolve } from 'path';
import { BaseTool } from './base.js';
import type { JSONSchema, ToolExecutionContext, ToolExecutionResult } from '../../types/tool.js';

export class CodeAnalysisTool extends BaseTool {
  name = 'code_analysis';
  description = '分析代码项目结构：文件统计、语言分布、依赖分析、项目概览。';
  category = 'code' as const;
  parameters: JSONSchema = {
    type: 'object',
    properties: {
      path: { type: 'string', description: '项目路径（默认当前目录）' },
      type: { type: 'string', enum: ['overview', 'dependencies', 'stats', 'structure'], description: '分析类型' },
    },
    required: [],
  };

  async execute(args: Record<string, unknown>, ctx: ToolExecutionContext): Promise<ToolExecutionResult> {
    const projectPath = resolve(ctx.cwd, (args.path as string) || '.');
    const type = (args.type as string) || 'overview';

    try {
      switch (type) {
        case 'dependencies': return this.analyzeDependencies(projectPath);
        case 'stats': return this.analyzeStats(projectPath);
        case 'structure': return this.analyzeStructure(projectPath);
        default: return this.analyzeOverview(projectPath);
      }
    } catch (err: any) {
      return this.error(err.message);
    }
  }

  private analyzeOverview(path: string): ToolExecutionResult {
    const lines: string[] = ['📊 项目概览\n'];
    // 检测项目类型
    if (existsSync(join(path, 'package.json'))) {
      const pkg = JSON.parse(readFileSync(join(path, 'package.json'), 'utf-8'));
      lines.push(`📦 ${pkg.name || 'Unknown'} v${pkg.version || '?'}`);
      lines.push(`📝 ${pkg.description || '无描述'}`);
      lines.push(`🔧 类型: Node.js / ${pkg.type === 'module' ? 'ESM' : 'CommonJS'}`);
      if (pkg.scripts) lines.push(`📜 脚本: ${Object.keys(pkg.scripts).join(', ')}`);
    }
    if (existsSync(join(path, 'pom.xml'))) lines.push('🔧 类型: Java (Maven)');
    if (existsSync(join(path, 'build.gradle'))) lines.push('🔧 类型: Java (Gradle)');
    if (existsSync(join(path, 'requirements.txt'))) lines.push('🔧 类型: Python');
    if (existsSync(join(path, 'go.mod'))) lines.push('🔧 类型: Go');
    if (existsSync(join(path, 'Cargo.toml'))) lines.push('🔧 类型: Rust');

    // 文件统计
    const stats = this.countFiles(path);
    lines.push(`\n📁 文件统计:`);
    for (const [ext, count] of Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
      lines.push(`  ${ext}: ${count} 个文件`);
    }
    return this.success(lines.join('\n'));
  }

  private analyzeDependencies(path: string): ToolExecutionResult {
    const pkgPath = join(path, 'package.json');
    if (!existsSync(pkgPath)) return this.error('未找到 package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    const lines: string[] = ['📦 依赖分析\n'];
    if (pkg.dependencies) {
      lines.push(`dependencies (${Object.keys(pkg.dependencies).length}):`);
      for (const [name, ver] of Object.entries(pkg.dependencies)) {
        lines.push(`  ${name}: ${ver}`);
      }
    }
    if (pkg.devDependencies) {
      lines.push(`\ndevDependencies (${Object.keys(pkg.devDependencies).length}):`);
      for (const [name, ver] of Object.entries(pkg.devDependencies)) {
        lines.push(`  ${name}: ${ver}`);
      }
    }
    return this.success(lines.join('\n'));
  }

  private analyzeStats(path: string): ToolExecutionResult {
    const stats = this.countFiles(path);
    let totalFiles = 0, totalSize = 0;
    const lines: string[] = ['📊 代码统计\n'];
    for (const [ext, count] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
      totalFiles += count;
      lines.push(`  ${ext.padEnd(15)} ${String(count).padStart(6)} 文件`);
    }
    lines.unshift(`总计: ${totalFiles} 个文件\n`);
    return this.success(lines.join('\n'));
  }

  private analyzeStructure(path: string): ToolExecutionResult {
    const lines: string[] = ['📁 项目结构\n'];
    this.buildTree(path, lines, '', 3, 0);
    return this.success(lines.join('\n'));
  }

  private countFiles(dir: string, stats: Record<string, number> = {}, depth = 0): Record<string, number> {
    if (depth > 5) return stats;
    try {
      for (const entry of readdirSync(dir)) {
        if (entry.startsWith('.') || entry === 'node_modules' || entry === 'dist' || entry === '__pycache__') continue;
        const full = join(dir, entry);
        try {
          const s = statSync(full);
          if (s.isDirectory()) this.countFiles(full, stats, depth + 1);
          else {
            const ext = extname(entry) || '(无扩展名)';
            stats[ext] = (stats[ext] || 0) + 1;
          }
        } catch {}
      }
    } catch {}
    return stats;
  }

  private buildTree(dir: string, lines: string[], prefix: string, maxDepth: number, depth: number): void {
    if (depth >= maxDepth) return;
    try {
      const entries = readdirSync(dir).filter(e => !e.startsWith('.') && e !== 'node_modules');
      for (const entry of entries.slice(0, 30)) {
        const full = join(dir, entry);
        try {
          if (statSync(full).isDirectory()) {
            lines.push(`${prefix}📂 ${entry}/`);
            this.buildTree(full, lines, prefix + '  ', maxDepth, depth + 1);
          } else {
            lines.push(`${prefix}📄 ${entry}`);
          }
        } catch {}
      }
    } catch {}
  }
}
