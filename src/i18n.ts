const translations = {
  en: {
    welcome: 'Welcome to Pokemon CLI!',
    help: 'Type help for commands.',
    language_set: 'Language set to English.',
  },
  es: {
    welcome: '¡Bienvenido a Pokemon CLI!',
    help: 'Escribe ayuda para comandos.',
    language_set: 'Idioma establecido en español.',
  },
};

let currentLanguage = 'en';

export function setLanguage(lang: string) {
  if (translations[lang as keyof typeof translations]) {
    currentLanguage = lang;
  }
}

export function t(key: string, lang?: string): string {
  const language = lang || currentLanguage;
  const trans = translations[language as keyof typeof translations];
  return trans?.[key as keyof typeof trans] || key;
}