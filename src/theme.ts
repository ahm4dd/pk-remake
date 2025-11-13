// @ts-ignore
import chalk from "chalk";

let currentTheme = 'default';

const themes = {
  default: { success: 'green', error: 'red', info: 'blue' },
  dark: { success: 'cyan', error: 'red', info: 'yellow' },
  'no-color': { success: 'reset', error: 'reset', info: 'reset' },
};

export function setTheme(theme: string): boolean {
  if (themes[theme as keyof typeof themes]) {
    currentTheme = theme;
    return true;
  }
  return false;
}

export function getTheme(): string {
  return currentTheme;
}

export function getThemeColor(type: string): string {
  const theme = themes[currentTheme as keyof typeof themes];
  return theme?.[type as keyof typeof theme] || 'reset';
}

export function applyTheme(text: string, color: string): string {
  if (currentTheme === 'no-color') {
    return text;
  }
  // Simple color application
  if (color === 'green') return chalk.green(text);
  if (color === 'red') return chalk.red(text);
  return text;
}

export { themes, currentTheme };