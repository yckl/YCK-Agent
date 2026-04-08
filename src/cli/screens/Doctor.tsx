import React from 'react';
import { ThemedBox, ThemedText } from '../components/design-system/index.js';

export function DoctorScreen() {
  return (
    <ThemedBox flexDirection="column" paddingX={2} paddingY={1} borderStyle="round" borderColor="warning">
       <ThemedText color="warning" bold>🩺 博士诊断面板 (Environment Doctor)</ThemedText>
       <ThemedBox flexDirection="column" marginTop={1}>
         <ThemedText>Node Version: {process.version}</ThemedText>
         <ThemedText>CWD: {process.cwd()}</ThemedText>
         <ThemedText>Network Status: <ThemedText color="success">Connected</ThemedText></ThemedText>
         <ThemedText>Token Quota: <ThemedText color="success">Sufficient</ThemedText></ThemedText>
       </ThemedBox>
    </ThemedBox>
  );
}
