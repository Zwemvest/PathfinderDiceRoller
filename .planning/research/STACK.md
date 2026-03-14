# Stack Research

**Domain:** Client-side PWA — tabletop RPG dice roller (PF2e)
**Researched:** 2026-03-14
**Confidence:** HIGH (core stack verified via multiple sources including official docs and npm metadata)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| SvelteKit 2 | ^2.55.0 | App framework | Runs fully client-side with `adapter-static` and `prerender = true`. Vite-native so PWA tooling integrates cleanly. Svelte 5 runes give fine-grained reactivity ideal for complex state (MAP tracking, roll history, multi-character GM mode). Smaller runtime than React/Vue means better PWA performance on mobile. |
| Svelte 5 | ^5.53.11 | Component model | Native TypeScript in markup (no preprocessor step). Runes API (`$state`, `$derived`, `$effect`) replaces Svelte stores cleanly. Compiled output: no virtual DOM overhead, critical for 60fps dice animations. |
| TypeScript | ^5.x | Type safety | Bundled with SvelteKit scaffolding. Essential for modelling complex PF2e data structures (character sheets, feat effects, roll results) without runtime surprises. |
| Vite 8 | ^8.0.0 | Build tool | Ships inside SvelteKit — no manual config. Rolldown-based (replaces esbuild/Rollup), sub-second hot reload. Required by SvelteKit 2. |
| Tailwind CSS v4 | ^4.2.1 | Styling | CSS-first `@theme` directive makes three switchable themes (parchment, Pathfinder brand, modern) trivial: define theme tokens per `[data-theme="..."]` selector, toggle on `<html>`. No runtime overhead. `@tailwindcss/vite` plugin integrates directly without PostCSS config. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vite-pwa/sveltekit | ^1.1.0 | PWA — service worker, manifest, offline caching | Always — handles Workbox service worker generation, Web App Manifest, and offline asset precaching in one plugin. Specifically built for SvelteKit's static build output. |
| Dexie.js | ^4.3.0 | IndexedDB ORM | Always — stores character sheets, roll history, and settings. v4 API is async/await first, supports versioned schema migrations (critical when character data format evolves), and has excellent TypeScript generics. Far less ceremony than raw IndexedDB. |
| @dice-roller/rpg-dice-roller | ^5.5.1 | Dice notation parsing and rolling | Always — parses standard notation (`3d6`, `2d8+5`) plus drop/keep modifiers (`4d6dh1`, `2d20kl1`). Handles advantage/disadvantage natively. MIT licensed. Use for all notation parsing; build PF2e modifier logic (MAP, status bonuses) on top of it. |
| @sveltejs/adapter-static | ^3.x | Static site output for GitHub Pages | Always — converts SvelteKit to a fully prerendered static bundle. Required for GitHub Pages hosting. Set `fallback: '404.html'` for client-side routing to work. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest 4 | Unit and component testing | `^4.1.0`. Browser Mode is now stable (v4.0, Oct 2025) — run component tests in a real browser via Playwright provider rather than jsdom. Use for PF2e modifier calculation logic, dice notation parsing tests, and character import parsing. |
| Playwright | E2E testing | Use alongside Vitest Browser Mode as the browser provider. Separately run full user-flow E2E tests (import character → roll skill check → verify audit log). |
| @testing-library/svelte | Component test utilities | Pairs with Vitest for rendering and querying Svelte components in tests. |
| fake-indexeddb | IndexedDB mock for tests | Run Dexie-based persistence tests in Node environment without a real browser. |
| ESLint + svelte-eslint-parser | Linting | Catches Svelte 5 rune misuse and TypeScript errors at edit time. |
| Prettier + prettier-plugin-svelte | Code formatting | Consistent `.svelte` file formatting. |

---

## Installation

```bash
# Scaffold
npm create svelte@latest pathfinder-dice-roller
# Choose: SvelteKit, TypeScript, ESLint, Prettier

# Static adapter (GitHub Pages)
npm install -D @sveltejs/adapter-static

# PWA
npm install -D @vite-pwa/sveltekit

# Tailwind v4
npm install -D tailwindcss @tailwindcss/vite

# IndexedDB
npm install dexie

# Dice rolling
npm install @dice-roller/rpg-dice-roller

# Testing
npm install -D vitest @vitest/browser playwright @testing-library/svelte fake-indexeddb
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| SvelteKit + adapter-static | Plain Svelte + Vite (no Kit) | Almost never — SvelteKit gives file-based routing, typed page data, and a well-tested static adapter. Plain Svelte requires manually wiring all of this. |
| SvelteKit + adapter-static | React + Vite | If your team has deep React expertise and no Svelte experience. React bundles ~40kb baseline vs Svelte's ~1.6kb. For a mobile PWA with dice animations, bundle size matters. |
| SvelteKit + adapter-static | Vue 3 + Vite | Vue is a valid alternative if preferred. Comparable bundle size to Svelte, but theming via CSS variables works the same way. No meaningful advantage over Svelte for this use case. |
| Dexie.js | idb (Jake Archibald) | If you want a minimal promise wrapper with no abstraction. idb is great for simple key-value storage but lacks Dexie's schema versioning and query API, which this app needs for roll history queries and schema migrations. |
| Dexie.js | localForage | If you need a localStorage fallback. localForage doesn't support complex queries or schema versioning. Dexie is the right choice when data structures are relational-ish (character ↔ rolls). |
| @dice-roller/rpg-dice-roller | Custom parser | Only if PF2e requires notation the library doesn't support (e.g., proprietary modifiers). The library handles all standard AnyDice notation including drop/keep. Build MAP and bonus stacking on top rather than replacing the parser. |
| Tailwind CSS v4 | Vanilla CSS custom properties only | If you want zero build-time CSS tooling. Vanilla CSS variables work for theming, but Tailwind v4 provides responsive utilities and a shared design token system that speeds up layout work significantly. |
| Tailwind CSS v4 | CSS Modules | CSS Modules have no theming story. Multiple switchable themes require a global token approach that Tailwind's `@theme` directive provides cleanly. |
| Vitest 4 Browser Mode | Jest + jsdom | jsdom doesn't implement real browser APIs (crypto, IndexedDB, service workers). For a PWA that relies on all of these, real-browser testing via Vitest Browser Mode is strictly more accurate. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Next.js / Nuxt | Server-side framework assumptions conflict with GitHub Pages (no Node server). Workarounds exist but add friction. | SvelteKit + adapter-static |
| Create React App | Abandoned in 2023. No maintenance, outdated toolchain. | SvelteKit or Vite-based scaffold |
| Workbox directly (without vite-plugin-pwa) | Correct service worker registration in a Vite build requires non-obvious configuration. vite-plugin-pwa wraps Workbox with correct build-time integration. | @vite-pwa/sveltekit |
| localStorage for persistence | 5MB storage cap, synchronous (blocks main thread), no structured queries, no transactions. The roll history alone will exceed localStorage limits for active users. | Dexie.js on IndexedDB |
| jest + jsdom | jsdom doesn't implement IndexedDB, crypto.getRandomValues (used by UUID generation), or service worker APIs. All three are core to this app. | Vitest 4 with Browser Mode |
| jQuery | No valid use case in a Vite/Svelte project. Adds weight, conflicts with Svelte's reactivity model. | Svelte reactive declarations |
| Bootstrap / Material UI | These component libraries fight with the three custom themes requirement. Building against their theming system is harder than owning your own Tailwind token layer. | Tailwind CSS v4 custom tokens |
| rpg-dice-roller (old unscoped package) | Superseded by `@dice-roller/rpg-dice-roller`. The old unscoped package is unmaintained. | `@dice-roller/rpg-dice-roller@^5.5.1` |

---

## Stack Patterns by Variant

**For the three-theme system (parchment / Pathfinder red-gold-dark / sleek modern):**
- Define Tailwind theme tokens scoped to `[data-theme="parchment"]`, `[data-theme="brand"]`, `[data-theme="modern"]` in `app.css`
- Toggle by setting `document.documentElement.dataset.theme` from a Svelte store
- Persist the user's theme choice in Dexie (settings table)
- Because Tailwind v4 uses native `@property` CSS custom properties, theme switches are instant with no flash

**For the GM mode (multiple characters):**
- Store multiple character objects in a Dexie `characters` table with a `lastActive` timestamp
- Active character ID lives in a Svelte `$state` rune at the app root — all roll components derive from it
- No URL routing needed; character switching is purely state-driven

**For offline-first PWA:**
- Use `@vite-pwa/sveltekit` with `generateSW` strategy (simpler than `injectManifest` for this use case)
- Cache strategy: `StaleWhileRevalidate` for app shell, `CacheFirst` for static assets
- All game logic runs client-side so there are no API calls to worry about in the service worker

**For GitHub Pages deployment:**
- Set `paths.base` in `svelte.config.js` to `'/<repo-name>'` when not using a custom domain
- Use GitHub Actions with `actions/upload-pages-artifact` and `actions/deploy-pages`
- Add a `static/.nojekyll` file to prevent Jekyll from processing the build output
- Set `trailingSlash: 'always'` in SvelteKit config for correct static routing

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| @sveltejs/kit@^2.55.0 | svelte@^5.x, vite@^8.x | SvelteKit 2 requires Vite 5+; Vite 8 confirmed working (SvelteKit uses Vite 7+ per kit@2.22.0 release notes) |
| @vite-pwa/sveltekit@^1.1.0 | @sveltejs/kit@^2.x, vite-plugin-pwa@^1.x | Designed for SvelteKit 2. Requires `adapter-static` for static site mode. |
| dexie@^4.3.0 | All modern browsers (Chrome 80+, Firefox 75+, Safari 14+) | v4 dropped IE support entirely. Target audience uses modern browsers, so no concern. |
| @dice-roller/rpg-dice-roller@^5.5.1 | ES Modules or bundled UMD | Import as ES module via Vite. Last published ~1 year ago but API is stable and comprehensive. |
| tailwindcss@^4.2.1 | @tailwindcss/vite, SvelteKit | CSS-in-`<style>` blocks need `@reference "../../app.css"` to access theme tokens when using `@apply`. Inline `style` attribute approach avoids this. |
| vitest@^4.1.0 | vite@^8.x | Vitest 4 requires Vite 5+. Use `@vitest/browser` with `playwright` provider for component tests. |

---

## Sources

- [npmjs.com: svelte](https://www.npmjs.com/package/svelte) — confirmed v5.53.11, published 2 days ago (HIGH confidence)
- [npmjs.com: @sveltejs/kit](https://www.npmjs.com/package/@sveltejs/kit) — confirmed v2.55.0, published 2 days ago (HIGH confidence)
- [npmjs.com: vite](https://www.npmjs.com/package/vite) — confirmed v8.0.0, published 1 day ago (HIGH confidence)
- [npmjs.com: tailwindcss](https://www.npmjs.com/package/tailwindcss) — confirmed v4.2.1 (HIGH confidence)
- [npmjs.com: dexie](https://www.npmjs.com/package/dexie) — confirmed v4.3.0 (HIGH confidence)
- [npmjs.com: @dice-roller/rpg-dice-roller](https://www.npmjs.com/package/@dice-roller/rpg-dice-roller) — confirmed v5.5.1 (HIGH confidence)
- [npmjs.com: @vite-pwa/sveltekit](https://www.npmjs.com/package/@vite-pwa/sveltekit) — confirmed v1.1.0 (HIGH confidence)
- [npmjs.com: vitest](https://www.npmjs.com/package/vitest) — confirmed v4.1.0 (HIGH confidence)
- [Vitest 4.0 release blog](https://vitest.dev/blog/vitest-4) — Browser Mode stable, Playwright integration (HIGH confidence)
- [SvelteKit static adapter docs](https://svelte.dev/docs/kit/adapter-static) — GitHub Pages configuration (HIGH confidence)
- [Tailwind CSS v4 blog](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first config, `@theme` directive (HIGH confidence)
- WebSearch: framework comparison, PWA patterns, IndexedDB wrapper comparison — used to validate community consensus (MEDIUM confidence for comparative claims)

---

*Stack research for: Client-side PF2e Dice Roller PWA — GitHub Pages*
*Researched: 2026-03-14*
