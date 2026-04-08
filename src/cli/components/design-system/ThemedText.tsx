import React from 'react';
import { Text, TextProps } from 'ink';
import { getTheme, Theme } from './theme.js';
import { useTheme } from './ThemeProvider.js';

type Color = string;

export type ThemedTextProps = Omit<TextProps, 'color' | 'backgroundColor'> & {
  color?: keyof Theme | Color;
  backgroundColor?: keyof Theme;
  dimColor?: boolean;
};

function resolveColor(color: keyof Theme | Color | undefined, theme: Theme): Color | undefined {
  if (!color) return undefined;
  if (color.startsWith('rgb(') || color.startsWith('#') || color.startsWith('ansi256(') || color.startsWith('ansi:')) {
    return color as Color;
  }
  return theme[color as keyof Theme] as Color;
}

export function ThemedText({
  color,
  backgroundColor,
  dimColor = false,
  children,
  ...rest
}: ThemedTextProps) {
  const [themeName] = useTheme();
  const theme = getTheme(themeName);

  const resolvedColor = dimColor ? (theme.inactive as Color) : resolveColor(color, theme);
  const resolvedBackgroundColor = backgroundColor ? (theme[backgroundColor] as Color) : undefined;

  return (
    <Text color={resolvedColor} backgroundColor={resolvedBackgroundColor} {...rest}>
      {children}
    </Text>
  );
}

export default ThemedText;
