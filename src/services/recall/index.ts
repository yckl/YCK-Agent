import * as fs from 'fs';
import * as path from 'path';

export class MemoryRecall {
  /**
   * Translates mtime into standard freshness tags
   */
  private static memoryFreshnessText(mtimeMs: number): string {
    const days = Math.floor((Date.now() - mtimeMs) / (1000 * 60 * 60 * 24));
    if (days <= 1) return 'Age: today/yesterday';
    return `This memory is ${days} days old.\nMemories are point-in-time observations, not live state — verify against current code before asserting as fact.`;
  }

  /**
   * Simulated memory retrieval loop
   */
  public static async findRelevantMemories(query: string, memoryDir: string): Promise<string[]> {
    if (!fs.existsSync(memoryDir)) return [];

    console.log('[Memory] Layer 2: Recalling memories based on user prompt...');
    
    // In true implementation this uses an offline Sonnet side-query with MAX_TOKENS: 256
    // We mock the filtering
    const files = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md') && f !== 'MEMORY.md');
    
    // Select top 5
    const selected = files.slice(0, 5);
    const contextInjections: string[] = [];

    for (const file of selected) {
        const fullPath = path.join(memoryDir, file);
        const stat = fs.statSync(fullPath);
        const warning = this.memoryFreshnessText(stat.mtimeMs);
        const content = fs.readFileSync(fullPath, 'utf8');
        
        contextInjections.push(`--- MEMORY FILE: ${file} ---\n${warning}\n\n${content}`);
    }

    return contextInjections;
  }
}
