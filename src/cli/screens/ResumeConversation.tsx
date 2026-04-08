import React from 'react';
import { ThemedBox, ThemedText } from '../components/design-system/index.js';

export function ResumeConversationScreen() {
  return (
    <ThemedBox flexDirection="column" paddingX={2} paddingY={1}>
       <ThemedText color="claude" bold>会话管理暂未实现 (WIP)</ThemedText>
       <ThemedText color="subtle">Press any key to return</ThemedText>
    </ThemedBox>
  );
}
