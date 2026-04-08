import * as fs from 'fs';
import * as path from 'path';

export class PrivacyManager {
  private static getHomeDir(): string {
    return process.env.HOME || process.env.USERPROFILE || '';
  }

  private static getClaudeDir(): string {
    return path.join(this.getHomeDir(), '.claude');
  }

  private static safeRemoveDir(dirName: string) {
    const target = path.join(this.getClaudeDir(), dirName);
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true });
    }
  }

  private static safeRemoveFile(fileName: string) {
    const target = path.join(this.getClaudeDir(), fileName);
    if (fs.existsSync(target)) {
      fs.unlinkSync(target);
    }
  }

  /**
   * LEVEL 1: Reset Device Identifiers
   */
  public static resetDeviceIdentifiers() {
    const configPath = path.join(this.getHomeDir(), '.claude.json');
    if (!fs.existsSync(configPath)) return;
    
    try {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const keysToRemove = ['userID', 'anonymousId', 'firstStartTime', 'claudeCodeFirstTokenDate'];
      keysToRemove.forEach(k => delete data[k]);
      fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
      console.log('✅ Level 1: Device traces removed. New userID will be generated on next run.');
    } catch {}
  }

  /**
   * LEVEL 2: Clear Telemetry Caches
   */
  public static clearTelemetryCaches() {
    this.safeRemoveDir('telemetry');
    this.safeRemoveDir('statsig');
    this.safeRemoveFile('stats-cache.json');
    console.log('✅ Level 2: Telemetry caches cleared.');
  }

  /**
   * LEVEL 3: Clear Sessions and History
   */
  public static clearSessionHistory() {
    this.safeRemoveFile('history.jsonl');
    ['sessions', 'paste-cache', 'shell-snapshots', 'session-env', 'file-history', 'debug'].forEach(dir => {
        this.safeRemoveDir(dir);
    });
    console.log('✅ Level 3: Session traces removed.');
  }

  /**
   * LEVEL 4: Clear OAuth
   */
  public static clearOAuthCache() {
    const configPath = path.join(this.getHomeDir(), '.claude.json');
    if (fs.existsSync(configPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const keysToRemove = [
          'oauthAccount', 's1mAccessCache', 'groveConfigCache',
          'passesEligibilityCache', 'clientDataCache',
          'cachedExtraUsageDisabledReason', 'githubRepoPaths'
        ];
        keysToRemove.forEach(k => delete data[k]);
        fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
      } catch {}
    }
    console.log('✅ Level 4: OAuth caches removed. (Note: MacOS keychain items must be removed manually using security tool)');
  }

  /**
   * LEVEL 5: Full Nuke
   */
  public static nukeAllData() {
    console.log('💣 Level 5: NUKING ALL DATA...');
    this.clearOAuthCache();
    this.clearSessionHistory();
    this.clearTelemetryCaches();
    this.resetDeviceIdentifiers();
    this.safeRemoveDir(''); // The wrapper root
    const configPath = path.join(this.getHomeDir(), '.claude.json');
    if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
    console.log('✅ Full reset complete. System will require onboarding on next start.');
  }
}
