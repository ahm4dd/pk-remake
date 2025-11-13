import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)', 'src/commands/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'], // Assuming a setup file might be useful later
  },
});
