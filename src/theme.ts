export interface Theme {
  primary: string;
  secondary: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  accent: string;
}

export const themes: Record<string, Theme> = {
  default: {
    primary: 'blue',
    secondary: 'cyan',
    success: 'green',
    error: 'red',
    warning: 'yellow',
    info: 'gray',
    accent: 'magenta',
  },
  pokemon: {
    primary: 'yellow',
    secondary: 'blue',
    success: 'green',
    error: 'red',
    warning: 'yellow',
    info: 'magenta',
    accent: 'cyan',
  },
  dark: {
    primary: 'white',
    secondary: 'gray',
    success: 'green',
    error: 'red',
    warning: 'yellow',
    info: 'blue',
    accent: 'cyan',
  },
};

export let currentTheme: Theme = themes.default;

// Set seasonal theme based on date
export function setSeasonalTheme() {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  if ((month === 12 && day >= 20) || (month === 1 && day <= 10)) {
    // Christmas/New Year
    currentTheme = {
      primary: 'red',
      secondary: 'green',
      success: 'green',
      error: 'red',
      warning: 'yellow',
      info: 'blue',
      accent: 'white',
    };
  } else if (month === 10 && day >= 20) {
    // Halloween
    currentTheme = {
      primary: 'orange',
      secondary: 'black',
      success: 'green',
      error: 'red',
      warning: 'yellow',
      info: 'purple',
      accent: 'gray',
    };
  } else if (month === 4 && day === 1) {
    // April Fools
    currentTheme = {
      primary: 'magenta',
      secondary: 'cyan',
      success: 'yellow',
      error: 'blue',
      warning: 'red',
      info: 'green',
      accent: 'white',
    };
  }
  // Default otherwise
}

// Initialize seasonal theme
setSeasonalTheme();

export function setTheme(name: string): boolean {
  if (themes[name]) {
    currentTheme = themes[name];
    return true;
  }
  return false;
}

export function getThemeColor(key: keyof Theme): string {
  return currentTheme[key];
}