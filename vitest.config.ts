import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
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
