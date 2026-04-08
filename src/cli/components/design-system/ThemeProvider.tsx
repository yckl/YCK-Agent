import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ThemeName, ThemeSetting } from './theme.js';

type ThemeContextValue = {
  themeSetting: ThemeSetting;
  setThemeSetting: (setting: ThemeSetting) => void;
  currentTheme: ThemeName;
};

const DEFAULT_THEME: ThemeName = 'dark';

const ThemeContext = createContext<ThemeContextValue>({
  themeSetting: DEFAULT_THEME,
  setThemeSetting: () => {},
  currentTheme: DEFAULT_THEME
});

type Props = {
  children?: React.ReactNode;
};

export function ThemeProvider({ children }: Props) {
  const [themeSetting, setThemeSetting] = useState<ThemeSetting>(DEFAULT_THEME);
  const currentTheme: ThemeName = themeSetting === 'auto' ? 'dark' : themeSetting;
  
  const value = useMemo<ThemeContextValue>(() => ({
    themeSetting,
    setThemeSetting,
    currentTheme
  }), [themeSetting, currentTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): [ThemeName, (setting: ThemeSetting) => void] {
  const { currentTheme, setThemeSetting } = useContext(ThemeContext);
  return [currentTheme, setThemeSetting];
}

export function useThemeSetting(): ThemeSetting {
  return useContext(ThemeContext).themeSetting;
}
