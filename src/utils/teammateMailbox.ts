import * as fs from 'fs';
import * as path from 'path';

export interface TeammateMessage {
  id: string;
  from: string;
  text: string;
  timestamp: string;
  read: boolean;
  color?: string;
  summary?: string;
  type?: 'text' | 'shutdown_request' | 'permission_request' | 'permission_response' | 'idle_notification';
  payload?: any;
}

export class TeammateMailbox {
  private static getInboxPath(teamName: string, agentName: string): string {
    const p = path.join(process.env.HOME || process.env.USERPROFILE || '', '.claude', 'teams', teamName, 'inboxes', `${agentName}.json`);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    return p;
  }

  // Atomic write simulated. Real impl uses proper-lockfile.
  public static writeToMailbox(teamName: string, toAgent: string, msg: Omit<TeammateMessage, 'id' | 'read' | 'timestamp'>) {
    const inbox = this.getInboxPath(teamName, toAgent);
    let messages: TeammateMessage[] = [];
    if (fs.existsSync(inbox)) {
        try { messages = JSON.parse(fs.readFileSync(inbox, 'utf8')); } catch { }
    }
    
    messages.push({
      ...msg,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      read: false
    });

    fs.writeFileSync(inbox, JSON.stringify(messages, null, 2), 'utf8');
  }

  public static readUnreadMessages(teamName: string, forAgent: string): TeammateMessage[] {
    const inbox = this.getInboxPath(teamName, forAgent);
    if (!fs.existsSync(inbox)) return [];
    
    let messages: TeammateMessage[] = [];
    try { messages = JSON.parse(fs.readFileSync(inbox, 'utf8')); } catch { }
    
    const unread = messages.filter(m => !m.read);
    
    if (unread.length > 0) {
      messages.forEach(m => m.read = true);
      fs.writeFileSync(inbox, JSON.stringify(messages, null, 2), 'utf8');
    }
    
    return unread;
  }
}
