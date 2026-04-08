export type Theme = {
  autoAccept: string
  bashBorder: string
  claude: string
  claudeShimmer: string
  permission: string
  planMode: string
  ide: string
  promptBorder: string
  text: string
  inverseText: string
  inactive: string
  subtle: string
  suggestion: string
  remember: string
  background: string
  success: string
  error: string
  warning: string
  merged: string
  // diff colors
  diffAdded: string
  diffRemoved: string
  diffAddedDimmed: string
  diffRemovedDimmed: string
  diffAddedWord: string
  diffRemovedWord: string
  // TUI V2 colors
  clawd_body: string
  clawd_background: string
  userMessageBackground: string
  userMessageBackgroundHover: string
  messageActionsBackground: string
  selectionBg: string
  bashMessageBackgroundColor: string
  memoryBackgroundColor: string
  rate_limit_fill: string
  rate_limit_empty: string
  fastMode: string
  briefLabelYou: string
  briefLabelClaude: string
}

export const THEME_NAMES = [
  'dark',
  'light',
  'light-ansi',
  'dark-ansi',
] as const

export type ThemeName = (typeof THEME_NAMES)[number]
export const THEME_SETTINGS = ['auto', ...THEME_NAMES] as const
export type ThemeSetting = (typeof THEME_SETTINGS)[number]

const lightTheme: Theme = {
  autoAccept: 'rgb(135,0,255)',
  bashBorder: 'rgb(255,0,135)',
  claude: 'rgb(215,119,87)',
  claudeShimmer: 'rgb(245,149,117)',
  permission: 'rgb(87,105,247)',
  planMode: 'rgb(0,102,102)',
  ide: 'rgb(71,130,200)',
  promptBorder: 'rgb(153,153,153)',
  text: 'rgb(0,0,0)',
  inverseText: 'rgb(255,255,255)',
  inactive: 'rgb(102,102,102)',
  subtle: 'rgb(175,175,175)',
  suggestion: 'rgb(87,105,247)',
  remember: 'rgb(0,0,255)',
  background: 'rgb(0,153,153)',
  success: 'rgb(44,122,57)',
  error: 'rgb(171,43,63)',
  warning: 'rgb(150,108,30)',
  merged: 'rgb(135,0,255)',
  diffAdded: 'rgb(105,219,124)',
  diffRemoved: 'rgb(255,168,180)',
  diffAddedDimmed: 'rgb(199,225,203)',
  diffRemovedDimmed: 'rgb(253,210,216)',
  diffAddedWord: 'rgb(47,157,68)',
  diffRemovedWord: 'rgb(209,69,75)',
  clawd_body: 'rgb(215,119,87)',
  clawd_background: 'rgb(0,0,0)',
  userMessageBackground: 'rgb(240, 240, 240)',
  userMessageBackgroundHover: 'rgb(252, 252, 252)',
  messageActionsBackground: 'rgb(232, 236, 244)',
  selectionBg: 'rgb(180, 213, 255)',
  bashMessageBackgroundColor: 'rgb(250, 245, 250)',
  memoryBackgroundColor: 'rgb(230, 245, 250)',
  rate_limit_fill: 'rgb(87,105,247)',
  rate_limit_empty: 'rgb(39,47,111)',
  fastMode: 'rgb(255,106,0)',
  briefLabelYou: 'rgb(37,99,235)',
  briefLabelClaude: 'rgb(215,119,87)',
}

const darkTheme: Theme = {
  autoAccept: 'rgb(175,135,255)',
  bashBorder: 'rgb(253,93,177)',
  claude: 'rgb(215,119,87)',
  claudeShimmer: 'rgb(235,159,127)',
  permission: 'rgb(177,185,249)',
  planMode: 'rgb(72,150,140)',
  ide: 'rgb(71,130,200)',
  promptBorder: 'rgb(136,136,136)',
  text: 'rgb(255,255,255)',
  inverseText: 'rgb(0,0,0)',
  inactive: 'rgb(153,153,153)',
  subtle: 'rgb(80,80,80)',
  suggestion: 'rgb(177,185,249)',
  remember: 'rgb(177,185,249)',
  background: 'rgb(0,204,204)',
  success: 'rgb(78,186,101)',
  error: 'rgb(255,107,128)',
  warning: 'rgb(255,193,7)',
  merged: 'rgb(175,135,255)',
  diffAdded: 'rgb(34,92,43)',
  diffRemoved: 'rgb(122,41,54)',
  diffAddedDimmed: 'rgb(71,88,74)',
  diffRemovedDimmed: 'rgb(105,72,77)',
  diffAddedWord: 'rgb(56,166,96)',
  diffRemovedWord: 'rgb(179,89,107)',
  clawd_body: 'rgb(215,119,87)',
  clawd_background: 'rgb(0,0,0)',
  userMessageBackground: 'rgb(55, 55, 55)',
  userMessageBackgroundHover: 'rgb(70, 70, 70)',
  messageActionsBackground: 'rgb(44, 50, 62)',
  selectionBg: 'rgb(38, 79, 120)',
  bashMessageBackgroundColor: 'rgb(65, 60, 65)',
  memoryBackgroundColor: 'rgb(55, 65, 70)',
  rate_limit_fill: 'rgb(177,185,249)',
  rate_limit_empty: 'rgb(80,83,112)',
  fastMode: 'rgb(255,120,20)',
  briefLabelYou: 'rgb(122,180,232)',
  briefLabelClaude: 'rgb(215,119,87)',
}

export function getTheme(themeName: ThemeName): Theme {
  switch (themeName) {
    case 'light': return lightTheme;
    case 'light-ansi': return lightTheme; // simplified fallback
    case 'dark-ansi': return darkTheme; // simplified fallback
    default: return darkTheme;
  }
}
