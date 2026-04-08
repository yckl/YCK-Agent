import React from 'react';
import { render } from 'ink';
import { ThemeProvider } from '../components/design-system/index.js';
import { DoctorScreen } from '../screens/Doctor.js';

export async function launchDoctorDialog() {
  const { waitUntilExit, unmount } = render(
    <ThemeProvider>
      <DoctorScreen />
    </ThemeProvider>
  );
  // Unmount after some logic
  setTimeout(() => unmount(), 3000);
}
