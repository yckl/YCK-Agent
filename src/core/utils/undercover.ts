export class UndercoverMode {
  
  /**
   * Automatically detect if the remote repository is an internal Anthropic repository.
   * If it's a public/open-source repo, we must go 'Undercover' to strip internal names.
   */
  public static isUndercoverRequired(remoteUrl: string): boolean {
    if (process.env.CLAUDE_CODE_UNDERCOVER === '1') return true;

    const INTERNAL_REMOTES = [
      'github.com/anthropic',
      'gitlab.com/anthropic-internal'
    ];
    
    return !INTERNAL_REMOTES.some(remote => remoteUrl.includes(remote));
  }

  /**
   * Applies the undercover filter to outbound content payload (like git commit messages)
   */
  public static applyUndercoverFilter(content: string): string {
    let scrubbed = content;
    
    // 1. Strip Co-Authored-By
    scrubbed = scrubbed.replace(/^.*Co-Authored-By:.*$/gm, '');
    
    // 2. Strip internal project codenames
    const INTERNAL_CODENAMES = ['Capybara', 'Tengu', 'Fennec', 'Chicago'];
    INTERNAL_CODENAMES.forEach(codename => {
       const reg = new RegExp(`\\b${codename}\\b`, 'gi');
       scrubbed = scrubbed.replace(reg, '[System_Module]');
    });

    // 3. Strip Slack channel mentions
    scrubbed = scrubbed.replace(/#team-claude-cli/gi, '#general');
    
    // 4. Strip Claude Code name
    scrubbed = scrubbed.replace(/\bClaude Code\b/gi, 'this tool');

    return scrubbed.trim();
  }
}
