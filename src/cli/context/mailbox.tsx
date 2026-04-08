export class MailboxBus {
  // Low-coupling event bus for components to pass messages (e.g. from Notification to AppState)
  public static emit(event: string, payload: any) {
    // mock emit
  }
}
