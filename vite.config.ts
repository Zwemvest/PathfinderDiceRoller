import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

const dev = process.env.NODE_ENV === 'development';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    SvelteKitPWA({
      base: dev ? '/' : '/PathfinderDiceRoller/',
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['client/**/*.{js,css,ico,png,svg,webp,webmanifest}', 'prerendered/**/*.{html,json}']
      },
      manifest: {
        name: 'Pathfinder Dice Roller',
        short_name: 'PF2e Dice',
        description: 'Roll dice for Pathfinder 2e with imported characters',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        scope: dev ? '/' : '/PathfinderDiceRoller/',
        start_url: dev ? '/' : '/PathfinderDiceRoller/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ]
});
