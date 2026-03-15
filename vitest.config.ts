import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { playwright } from '@vitest/browser-playwright';
import path from 'path';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  resolve: {
    alias: {
      // SvelteKit virtual module stubs for vitest browser mode
      // (svelte() plugin does not resolve $app/* like sveltekit() does)
      '$app/state': path.resolve('./src/test-stubs/app-state.ts'),
      '$app/paths': path.resolve('./src/test-stubs/app-paths.ts'),
      '$app/environment': path.resolve('./src/test-stubs/app-environment.ts'),
      '$app/navigation': path.resolve('./src/test-stubs/app-navigation.ts'),
      '$lib': path.resolve('./src/lib')
    }
  },
  optimizeDeps: {
    include: ['dexie', '@dice-roller/rpg-dice-roller']
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.ts', 'src/**/*.test.svelte.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }]
          },
          setupFiles: ['vitest-setup-browser.ts']
        }
      },
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.unit.test.ts'],
          environment: 'node'
        }
      }
    ]
  }
});
