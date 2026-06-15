import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: 'forks',
    poolOptions: {
      forks: { singleFork: true },
    },
    environment: 'node',
    include: ['src/**/*.test.ts'],
    environmentMatchGlobs: [
      ['src/lib/rct/learnProgress.test.ts', 'jsdom'],
      ['src/lib/rct/auditProgress.test.ts', 'jsdom'],
    ],
  },
});
