import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import type { ToolResult } from '../../types/message.js';
import { SafeFSOperations } from '../utils/fsOperations.js';

export class ToolResultBudgetAllocator {
  public static readonly MAX_TOTAL_BUDGET = 200_000;
  public static readonly MAX_TOOL_BUDGET = 50_000;

  public static applyBudgetLimits(results: ToolResult[]): ToolResult[] {
    const mustReapply: ToolResult[] = [];
    const frozen: ToolResult[] = [];
    const fresh: ToolResult[] = [];

    // 1. Partition
    for (const r of results) {
      if (r.meta?.frozenAt) {
        frozen.push(r);
      } else if (r.meta?.replacementTag) {
        mustReapply.push(r);
      } else {
        fresh.push(r);
      }
    }

    // 2. Process Fresh
    const processedFresh: ToolResult[] = [];
    let consumedBudget = 0;

    for (const freshResult of fresh) {
      let content = freshResult.content;
      if (typeof content !== 'string') continue;

      let needsTruncation = false;
      let finalContent = content;

      if (content.length > this.MAX_TOOL_BUDGET) {
        needsTruncation = true;
      } else if (consumedBudget + content.length > this.MAX_TOTAL_BUDGET) {
        needsTruncation = true;
      }

      if (needsTruncation) {
        // Truncate to limit or remaining budget, min 2KB
        const allowedLen = Math.max(Math.min(this.MAX_TOOL_BUDGET, this.MAX_TOTAL_BUDGET - consumedBudget), 2000);
        const prefix = content.substring(0, allowedLen);
        const hash = crypto.randomBytes(4).toString('hex');
        const dumpPath = path.join(os.tmpdir(), `yck_tool_dump_${hash}.txt`);
        
        // Fire & forget async write (non-blocking)
        SafeFSOperations.safeWriteFile(dumpPath, content).catch(() => {});

        finalContent = prefix + `\n\n[...Output truncated (${content.length} chars). Full output saved to disk: ${dumpPath}]`;
        
        freshResult.meta = { ...freshResult.meta, replacementTag: finalContent, diskPath: dumpPath };
      }

      consumedBudget += finalContent.length;
      processedFresh.push({ ...freshResult, content: finalContent });
    }

    return [...mustReapply, ...frozen, ...processedFresh];
  }
}
