import { describe, it, expect } from 'vitest';
import { setTheme, getTheme, applyTheme } from '../src/theme.js';

describe('Theme Management', () => {
  it('should set and get theme', () => {
    setTheme('dark');
    expect(getTheme()).toBe('dark');
  });

  it('should apply theme to text', () => {
    setTheme('default');
    const colored = applyTheme('Hello', 'green');
    expect(colored).toContain('Hello'); // Assuming it adds color codes
  });

  it('should disable colors in no-color theme', () => {
    setTheme('no-color');
    const plain = applyTheme('Hello', 'green');
    expect(plain).toBe('Hello'); // No color codes
  });
});