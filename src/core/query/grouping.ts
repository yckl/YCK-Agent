import type { Message } from '../../types/message.js';

export function roughTokenCountEstimation(text: string): number {
  return text.length / 4;
}

export function estimateMessageTokens(messages: Message[]): number {
  let totalTokens = 0;
  for (const message of messages) {
    if (message.role === 'user' || message.role === 'assistant') {
      totalTokens += roughTokenCountEstimation(message.content || '');
    } else if (message.role === 'tool') {
      totalTokens += roughTokenCountEstimation(message.content || '');
    }
  }
  return Math.ceil(totalTokens * (4 / 3)); // Conservative 33% padding
}

export function groupMessagesByApiRound(messages: Message[]): Message[][] {
  const groups: Message[][] = [];
  let current: Message[] = [];
  
  for (const msg of messages) {
    // Treat User message as start of an API round
    if (msg.role === 'user' && current.length > 0) {
      groups.push([...current]);
      current = [msg];
    } else {
      current.push(msg);
    }
  }

  if (current.length > 0) {
    groups.push(current);
  }
  
  return groups;
}
