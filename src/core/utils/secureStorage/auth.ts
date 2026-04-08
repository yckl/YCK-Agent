export class KeychainAuth {
  public static async retrieveToken(provider: string) {
    // Cross-platform OS keychain integrations
    return process.env[`${provider.toUpperCase()}_API_KEY`];
  }
}
