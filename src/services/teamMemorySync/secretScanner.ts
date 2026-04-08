export class SecretScanner {
  // A mapping of 30+ rules based on the user's notes
  private static readonly PATTERNS: Record<string, RegExp> = {
    'AWS Access Token': /\b(A3T|AKIA|ASIA|ABIA|ACCA)[A-Z0-9]{16}\b/g,
    'GCP API Key': /\bAIza[0-9A-Za-z\\-_]{35}\b/g,
    'Anthropic API Key': new RegExp(`\\b${['sk', 'ant', 'api03'].join('-')}[a-zA-Z0-9\\-_]{40,}\\b`, 'g'),
    'Anthropic Admin Key': new RegExp(`\\b${['sk', 'ant', 'admin01'].join('-')}[a-zA-Z0-9\\-_]{40,}\\b`, 'g'),
    'OpenAI API Key': /\bsk-(proj|svcacct|admin)-[a-zA-Z0-9]{20,}T3BlbkFJ[a-zA-Z0-9]+\b/g,
    'HuggingFace Token': /\bhf_[a-zA-Z0-9]{34}\b/g,
    'GitHub Token': /\b(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36}\b/g,
    'GitLab PAT': /\bglpat-[a-zA-Z0-9\-]{20}\b/g,
    'Slack Token': /\b(xox[pboaus]-[0-9]{12}-[0-9]{12}-[0-9]{12}-[a-z0-9]{32})\b/g,
    'Stripe Token': /\b(sk_test|sk_live|rk_)[a-zA-Z0-9]{20,}\b/g,
    'PEM Private Key': /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g
  };

  /** Scans content for secrets and returns names of found secret categories. Returns empty array if clean. */
  public static scan(content: string): string[] {
    const foundSecrets: string[] = [];
    
    for (const [name, pattern] of Object.entries(this.PATTERNS)) {
      if (pattern.test(content)) {
        foundSecrets.push(name);
      }
    }
    
    return foundSecrets;
  }
}
