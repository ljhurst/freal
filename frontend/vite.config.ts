import { readFileSync } from 'node:fs';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

const appVersion = /^version = "(.+)"$/m.exec(
  readFileSync(new URL('../pyproject.toml', import.meta.url), 'utf8'),
)?.[1];

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(appVersion) },
  plugins: [svelte(), svelteTesting()],
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
  build: {
    // Nothing is inlined as a data: URI, so the CSP can stay strict (fonts load from 'self').
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    // CSS is stubbed in tests unless asked for; the token tests read the stylesheet itself.
    css: { include: [/app\.css/] },
  },
});
