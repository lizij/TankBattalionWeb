import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'docs',
  },
  server: {
    port: 5173,
    host: true,
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
