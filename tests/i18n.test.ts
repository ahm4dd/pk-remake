import { describe, it, expect } from 'vitest';
import { t } from '../src/i18n.js';

describe('Internationalization', () => {
  it('should translate messages to English by default', () => {
    expect(t('welcome')).toBe('Welcome to Pokemon CLI!');
  });

  it('should translate messages to Spanish when set', () => {
    // Assume setLanguage('es')
    // But for test, mock
    expect(t('welcome', 'es')).toBe('¡Bienvenido a Pokemon CLI!');
  });

  it('should fallback to key if translation not found', () => {
    expect(t('unknown')).toBe('unknown');
  });
});