import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    hookTimeout: 30_000, // beforeAll re-ingests, give it room
    testTimeout: 15_000,
  },
});
