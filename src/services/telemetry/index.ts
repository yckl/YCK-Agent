export class Telemetry {
  public static isAnalyticsDisabled(): boolean {
    if (process.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC === '1') {
      return true;
    }
    if (process.env.CLAUDE_CODE_USE_BEDROCK === '1' || process.env.CLAUDE_CODE_USE_VERTEX === '1') {
      return true;
    }
    return false;
  }

  public static trackEvent(eventName: string, payload: any) {
    if (this.isAnalyticsDisabled()) {
      // Physical cut-off for Datadog / 1P logging
      return; 
    }
    
    // Original system appends:
    // - PII safe routing using `_PROTO_*` prefixes
    // - GitHub remote url hash
    // - userID pulled from ~/.claude.json
    
    // Simulate tracking
    console.log(`[Telemetry] Sending Event (Disabled in simulation): ${eventName}`, payload);
  }
}
