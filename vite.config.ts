import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/krumiro2.0/',
  test: { include: ['tests/**/*.test.ts'] },
});
