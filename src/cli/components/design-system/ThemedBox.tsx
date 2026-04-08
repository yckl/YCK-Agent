import React from 'react';
import { Box, BoxProps } from 'ink';
import { getTheme, Theme } from './theme.js';
import { useTheme } from './ThemeProvider.js';

type Color = string;

type ThemedColorProps = {
  borderColor?: keyof Theme | Color;
  borderTopColor?: keyof Theme | Color;
  borderBottomColor?: keyof Theme | Color;
  borderLeftColor?: keyof Theme | Color;
  borderRightColor?: keyof Theme | Color;
  backgroundColor?: keyof Theme | Color;
};

export type ThemedBoxProps = Omit<BoxProps, keyof ThemedColorProps> & ThemedColorProps & { children?: React.ReactNode };

function resolveColor(color: keyof Theme | Color | undefined, theme: Theme): Color | undefined {
  if (!color) return undefined;
  if (color.startsWith('rgb(') || color.startsWith('#') || color.startsWith('ansi256(') || color.startsWith('ansi:')) {
    return color as Color;
  }
  return theme[color as keyof Theme] as Color;
}

export const ThemedBox = React.forwardRef((props: ThemedBoxProps, ref) => {
  const {
    borderColor,
    borderTopColor,
    borderBottomColor,
    borderLeftColor,
    borderRightColor,
    backgroundColor,
    children,
    ...rest
  } = props;
  
  const [themeName] = useTheme();
  const theme = getTheme(themeName);

  return (
    <Box
      ref={ref as any}
      borderColor={resolveColor(borderColor, theme)}
      borderTopColor={resolveColor(borderTopColor, theme)}
      borderBottomColor={resolveColor(borderBottomColor, theme)}
      borderLeftColor={resolveColor(borderLeftColor, theme)}
      borderRightColor={resolveColor(borderRightColor, theme)}
      backgroundColor={resolveColor(backgroundColor, theme)}
      {...rest}
    >
      {children}
    </Box>
  );
});
