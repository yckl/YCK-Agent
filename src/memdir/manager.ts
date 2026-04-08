import * as fs from 'fs';
import * as path from 'path';

export type MemoryType = 'user' | 'feedback' | 'project' | 'reference';

export interface MemoryEntry {
  filename: string;
  type: MemoryType;
  description: string;
}

export class MemoryManager {
  public static readonly MAX_ENTRYPOINT_LINES = 200;
  
  /** Append to MEMORY.md index without overwriting existing details */
  public static appendToIndex(projectMemoryDir: string, entry: MemoryEntry) {
    const indexPath = path.join(projectMemoryDir, 'MEMORY.md');
    let content = '';

    if (fs.existsSync(indexPath)) {
       content = fs.readFileSync(indexPath, 'utf-8');
    }

    const lines = content.split('\n').filter(l => l.trim().length > 0);
    const newEntryStr = `- [${entry.type}-${entry.description.substring(0, 20)}](${entry.filename}) — ${entry.description}`;
    
    // Deduplication check
    if (lines.some(l => l.includes(`(${entry.filename})`))) {
       return; 
    }

    lines.push(newEntryStr);
    
    if (lines.length > this.MAX_ENTRYPOINT_LINES) {
      // Truncate logic
      lines.splice(0, lines.length - this.MAX_ENTRYPOINT_LINES);
      lines.push('\n_Warning: Older index entries truncated..._');
    }

    fs.writeFileSync(indexPath, lines.join('\n'), 'utf-8');
  }

  public static async writeMemoryFile(projectMemoryDir: string, type: MemoryType, desc: string, content: string) {
    const safeDesc = desc.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 15);
    const filename = `${type}_${safeDesc}_${Date.now()}.md`;
    const fullPath = path.join(projectMemoryDir, filename);

    const frontMatter = `---
type: ${type}
description: ${desc}
---

${content}`;

    fs.mkdirSync(projectMemoryDir, { recursive: true });
    fs.writeFileSync(fullPath, frontMatter, 'utf-8');

    this.appendToIndex(projectMemoryDir, { filename, type, description: desc });
    return fullPath;
  }
}
