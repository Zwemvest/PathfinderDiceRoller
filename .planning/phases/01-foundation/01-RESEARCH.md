# Phase 1: Foundation - Research

**Researched:** 2026-03-14
**Domain:** SvelteKit 2 + Svelte 5 PWA shell, Tailwind CSS v4, Dexie v4/IndexedDB, GitHub Pages CI/CD
**Confidence:** HIGH (core stack), MEDIUM (PWA base-path pitfall workaround)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **App Shell Layout**: Bottom tab navigation (Character, Roll, History tabs). On mobile: tabs at bottom, swipe/tap between views. On desktop: same tab structure, potential sidebar expansion.
- **Sticky dice tray bar**: Always visible at the bottom of the screen (above tabs on mobile). Quick-access rolling from any view.
- **Roll result card**: Persistent card above the dice tray. Stays until next roll replaces it (not a toast).
- **Roll history**: Dedicated History tab — full scrollable log.
- **Deployment**: GitHub username `zwemvest`, repo `PathfinderDiceRoller`. GitHub Pages URL: `zwemvest.github.io/PathfinderDiceRoller`. `paths.base` must be `/PathfinderDiceRoller`. GitHub Actions CI/CD on push to `main`. Trunk-based development.
- **Offline & Storage**: IndexedDB via Dexie v4 with stores: `characters`, `rollHistory`, `settings`, `heroPoints`. Full precache strategy. Request `navigator.storage.persist()` on first use. Export option as iOS safety net. PWA via `@vite-pwa/sveltekit` with Workbox `generateSW`.
- **Dev environment**: npm, ESLint, Prettier, Vitest 4 Browser Mode, TypeScript strict mode.

### Claude's Discretion
- Exact Tailwind theme token structure (must be forward-compatible with three-theme system in later phase)
- Desktop breakpoint layout expansion behavior
- ESLint rule configuration (standard SvelteKit preset)
- GitHub Actions workflow specifics
- Dexie schema version strategy
- Exact responsive breakpoints

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLAT-01 | App is hosted on GitHub Pages as a static site | `@sveltejs/adapter-static` + GitHub Actions deploy workflow |
| PLAT-02 | App is installable as a PWA (manifest + service worker) | `@vite-pwa/sveltekit` with `generateSW` + base path config |
| PLAT-03 | App works offline after initial load | Workbox full precache strategy + `export const prerender = true` |
| PLAT-04 | App is responsive — usable on phone, tablet, and desktop | Tailwind v4 responsive utilities, mobile-first bottom-tab layout |
| PLAT-05 | All data stored client-side in IndexedDB | Dexie v4 class-based schema, browser-only guard, `navigator.storage.persist()` |
</phase_requirements>

---

## Summary

This phase bootstraps a greenfield SvelteKit 2 / Svelte 5 project that ships as an installable, offline-capable PWA deployed to GitHub Pages. The stack is locked: SvelteKit 2 with `@sveltejs/adapter-static`, Tailwind CSS v4 (Vite plugin), Dexie v4 for IndexedDB, and `@vite-pwa/sveltekit` for service worker generation. The entire phase produces only an app shell — no business logic, no dice rolling, no character data — but every integration point must be wired correctly because all subsequent phases depend on these foundations.

The single highest-risk item in this phase is the interaction between `@vite-pwa/sveltekit` and SvelteKit's `paths.base` for GitHub Pages subdirectory hosting. This is a documented issue: setting only `kit.paths.base` in `svelte.config.js` is insufficient — the `base` option must also be set inside the `SvelteKitPWA()` plugin call, and at least one page must be marked `prerender = true` for offline caching to work. Without both of these, the manifest and service worker are served from the wrong URL.

The Dexie schema must be designed forward-compatibly from the start: Phase 2 adds character import fields, Phase 4 adds roll history. Using Dexie's versioning system (incrementing `.version()` calls) is the migration path. All Dexie access must be guarded behind SvelteKit's `browser` import from `$app/environment` to prevent SSR crashes.

**Primary recommendation:** Scaffold with `npx sv create` (TypeScript + SvelteKit), then layer in Tailwind v4, Dexie v4, and `@vite-pwa/sveltekit` in that order, configuring the GitHub Pages base path in both `svelte.config.js` and the PWA plugin before writing any UI code.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@sveltejs/kit` | 2.x | App framework + routing | Locked decision; SSG via adapter-static |
| `svelte` | 5.x | Component language | Locked decision; runes API (no legacy stores) |
| `@sveltejs/adapter-static` | latest | GitHub Pages static output | Required for zero-server deployment |
| `tailwindcss` | 4.x | Utility CSS | Locked decision; v4 Vite plugin, no config file |
| `@tailwindcss/vite` | 4.x | Vite integration for Tailwind v4 | Replaces PostCSS pipeline entirely |
| `dexie` | 4.x | IndexedDB wrapper | Locked decision; best Svelte 5/SSR support |
| `@vite-pwa/sveltekit` | latest | PWA plugin (manifest + SW) | Locked decision; generates Workbox service worker |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | 4.x | Test runner | All tests; v4 ships stable browser mode |
| `@vitest/browser-playwright` | latest | Real-browser test provider | Required for IndexedDB/crypto/SW tests |
| `vitest-browser-svelte` | latest | Svelte component rendering in browser mode | Component tests |
| `playwright` | latest | Browser automation backing Vitest | Installs with `npx playwright install chromium` |
| `eslint` | latest | Linting | SvelteKit default preset |
| `prettier` | latest | Formatting | SvelteKit default config |
| `prettier-plugin-svelte` | latest | Svelte-aware formatting | Required companion to Prettier |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Dexie v4 | idb (Jake Archibald) | idb is thinner but no liveQuery reactivity or TypeScript Table generics |
| `@vite-pwa/sveltekit` | Manual service worker | Hand-rolling Workbox precache is high risk and maintenance burden |
| Tailwind v4 | Tailwind v3 | v4 has zero-config Vite plugin, native CSS variables for theme tokens — forward-compatible with three-theme system |
| Vitest browser mode | jsdom + fake-indexeddb | jsdom can't test real service workers or `crypto.getRandomValues` |

### Installation

```bash
# Start fresh (TypeScript + SvelteKit, choose no additional integrations)
npx sv create PathfinderDiceRoller
cd PathfinderDiceRoller

# Replace auto adapter with static
npm uninstall @sveltejs/adapter-auto
npm install -D @sveltejs/adapter-static

# Tailwind CSS v4
npm install -D tailwindcss @tailwindcss/vite

# Dexie v4
npm install dexie

# PWA plugin
npm install -D @vite-pwa/sveltekit

# Vitest browser mode
npm install -D vitest @vitest/browser-playwright vitest-browser-svelte playwright
npx playwright install chromium
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── lib/
│   ├── db/
│   │   └── index.ts          # Dexie database class + singleton export
│   ├── components/
│   │   ├── layout/
│   │   │   ├── TabBar.svelte       # Bottom tab navigation
│   │   │   ├── DiceTray.svelte     # Sticky dice input bar
│   │   │   └── RollResultCard.svelte # Persistent last-roll display
│   │   └── ui/               # Reusable primitives (buttons, cards)
│   └── types/
│       └── index.ts          # Shared TypeScript interfaces
├── routes/
│   ├── +layout.svelte        # Root layout: TabBar + DiceTray + slot
│   ├── +layout.ts            # export const prerender = true
│   ├── +page.svelte          # Redirects to /character (default tab)
│   ├── character/
│   │   └── +page.svelte      # Character tab (shell for Phase 2)
│   ├── roll/
│   │   └── +page.svelte      # Roll tab (shell for Phase 3+)
│   └── history/
│       └── +page.svelte      # History tab (shell for Phase 4)
├── app.css                   # @import "tailwindcss"; + @theme tokens
└── app.html                  # SvelteKit HTML template
static/
├── .nojekyll                 # Prevents GitHub Pages Jekyll processing
└── icons/                    # PWA icons (192x192, 512x512 minimum)
.github/
└── workflows/
    └── deploy.yml            # GitHub Actions build + deploy
```

### Pattern 1: SvelteKit Static Adapter + GitHub Pages Base Path

**What:** Configure `svelte.config.js` to use `adapter-static` and set `paths.base` conditionally, then mirror that base in the PWA plugin.
**When to use:** Required — GitHub Pages serves from `/PathfinderDiceRoller`, not root.

```typescript
// svelte.config.js
import adapter from '@sveltejs/adapter-static';

const dev = process.env.NODE_ENV === 'development';

const config = {
  kit: {
    adapter: adapter({
      fallback: '404.html'
    }),
    paths: {
      base: dev ? '' : '/PathfinderDiceRoller'
    }
  }
};
export default config;
```

```typescript
// vite.config.ts — CRITICAL: base must also be set in SvelteKitPWA()
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import tailwindcss from '@tailwindcss/vite';
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
        theme_color: '#1a1a2e',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
});
```

```typescript
// src/routes/+layout.ts — REQUIRED for offline caching to work
export const prerender = true;
```

### Pattern 2: Dexie v4 Class-Based Schema

**What:** Define the database as a typed class; export a singleton. All stores declared at v1 for forward-compatibility.
**When to use:** Always — the singleton is imported wherever data access is needed.

```typescript
// src/lib/db/index.ts
import Dexie, { type Table } from 'dexie';

// Phase 1 placeholder interfaces — fields expanded in later phases
export interface Character {
  id?: number;
  importedAt: Date;
  name: string;
  raw: string; // raw JSON blob, parsed in Phase 2
}

export interface RollHistoryEntry {
  id?: number;
  rolledAt: Date;
  expression: string;
  result: number;
}

export interface Settings {
  id?: number;
  key: string;
  value: string;
}

export interface HeroPoint {
  id?: number;
  characterId: number;
  count: number;
}

class AppDatabase extends Dexie {
  characters!: Table<Character>;
  rollHistory!: Table<RollHistoryEntry>;
  settings!: Table<Settings>;
  heroPoints!: Table<HeroPoint>;

  constructor() {
    super('PathfinderDiceRoller');
    this.version(1).stores({
      characters: '++id, name, importedAt',
      rollHistory: '++id, rolledAt',
      settings: '++id, key',
      heroPoints: '++id, characterId'
    });
  }
}

export const db = new AppDatabase();
```

```svelte
<!-- Using Dexie in a SvelteKit component — MUST guard with browser check -->
<script lang="ts">
  import { browser } from '$app/environment';
  import { db } from '$lib/db';
  import { liveQuery } from 'dexie';

  // liveQuery returns an observable; only run in browser
  const characters = browser
    ? liveQuery(() => db.characters.toArray())
    : null;
</script>
```

### Pattern 3: Tailwind v4 Theme Tokens (Forward-Compatible for Three-Theme System)

**What:** Define semantic CSS custom properties in `@theme` blocks in `app.css`. These become Tailwind utilities and are overridable per-theme via `@custom-variant` or `[data-theme]` selectors.
**When to use:** Set up in Phase 1 so later phases can add themes without touching component markup.

```css
/* src/app.css */
@import "tailwindcss";

@theme {
  /* Brand palette — forward-compatible token names */
  --color-surface-base: #1a1a2e;
  --color-surface-raised: #16213e;
  --color-surface-overlay: #0f3460;
  --color-text-primary: #e2e8f0;
  --color-text-muted: #94a3b8;
  --color-accent: #e94560;
  --color-accent-muted: #c73652;

  /* Spacing for touch-friendly targets */
  --tap-target-min: 44px;

  /* Breakpoints */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
}
```

### Pattern 4: Root Layout with Sticky Bottom Chrome

**What:** `+layout.svelte` renders the tab bar and dice tray at the bottom; the content area scrolls above them.
**When to use:** This is the single root layout — all pages live inside it.

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  import { pwaInfo } from 'virtual:pwa-info';
  import TabBar from '$lib/components/layout/TabBar.svelte';
  import DiceTray from '$lib/components/layout/DiceTray.svelte';
  import RollResultCard from '$lib/components/layout/RollResultCard.svelte';

  let { children } = $props();
  $: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';
</script>

<svelte:head>
  {@html webManifestLink}
</svelte:head>

<!-- Full-height flex column: scrollable content + fixed bottom chrome -->
<div class="flex flex-col h-screen overflow-hidden bg-surface-base text-text-primary">
  <!-- Scrollable page content -->
  <main class="flex-1 overflow-y-auto">
    {@render children()}
  </main>

  <!-- Persistent roll result (above dice tray) -->
  <RollResultCard />

  <!-- Sticky dice tray -->
  <DiceTray />

  <!-- Bottom tabs -->
  <TabBar />
</div>
```

### Pattern 5: PWA Web Manifest Link Injection

**What:** `@vite-pwa/sveltekit` exposes `virtual:pwa-info` — the manifest `<link>` tag must be injected via `svelte:head`.
**When to use:** Required in the root `+layout.svelte` — controls what shows in the browser's "Add to Home Screen" prompt.

### Pattern 6: navigator.storage.persist() on First Use

**What:** Request persistent storage on first app load to prevent iOS Safari from evicting IndexedDB data.
**When to use:** Call once on app init, store result in settings table.

```typescript
// src/lib/db/persistence.ts
import { browser } from '$app/environment';
import { db } from './index';

export async function requestPersistentStorage(): Promise<void> {
  if (!browser || !navigator.storage?.persist) return;

  const alreadyRequested = await db.settings.where('key').equals('persistenceRequested').first();
  if (alreadyRequested) return;

  await navigator.storage.persist();
  await db.settings.add({ key: 'persistenceRequested', value: 'true' });
}
```

### Pattern 7: GitHub Actions Deployment Workflow

**What:** Build on push to `main`, upload artifact, deploy to GitHub Pages.
**When to use:** One-time setup; runs automatically thereafter.

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          NODE_ENV: production
      - uses: actions/upload-pages-artifact@v3
        with:
          path: build/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### Pattern 8: Vitest Browser Mode Configuration

**What:** Use real Chromium for all tests so IndexedDB, crypto, and service worker APIs work without mocks.
**When to use:** Phase 1 establishes the test config; all subsequent phases add tests to it.

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    projects: [
      {
        // Browser tests — real IndexedDB, real crypto
        extends: true,
        test: {
          name: 'browser',
          include: ['src/**/*.browser.test.ts', 'src/**/*.test.svelte.ts'],
          browser: {
            enabled: true,
            provider: 'playwright',
            instances: [{ browser: 'chromium' }]
          }
        }
      },
      {
        // Unit tests — pure logic, no browser APIs
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
```

### Anti-Patterns to Avoid

- **Setting `paths.base` only in `svelte.config.js`:** The PWA plugin also needs `base` set. Without it, the manifest and service worker resolve from URL root, breaking offline support on GitHub Pages subdirectories.
- **Importing Dexie outside browser check:** SvelteKit runs `+page.svelte` `<script>` blocks on the server during prerendering. Importing `db` without `browser` guard causes server-side IndexedDB errors.
- **Not marking routes as prerendered:** If `export const prerender = true` is missing from `+layout.ts`, Workbox won't cache HTML files and the app fails offline on second load.
- **Using `export let` instead of `$props()` in Svelte 5:** Legacy Svelte 4 syntax. SvelteKit scaffolds with Svelte 5; use `let { children } = $props()`.
- **Calling `navigator.storage.persist()` without a browser guard:** The API doesn't exist in Node; always guard with `browser` check.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Service worker + precaching | Custom SW registration + cache logic | `@vite-pwa/sveltekit` generateSW | Workbox handles versioning, update prompts, cache busting; hand-rolled caches miss assets |
| IndexedDB CRUD | Raw `indexedDB.open()` / `objectStore` | Dexie v4 | IDB transaction management is error-prone; Dexie handles upgrades, errors, and typed queries |
| CSS theming system | Runtime JS theme-switcher | Tailwind v4 `@theme` + `[data-theme]` selectors | v4 CSS variables are zero-JS overhead; survives SSR |
| GitHub Pages deploy | Manual `git push` to `gh-pages` branch | GitHub Actions `actions/deploy-pages` | Official action handles artifact upload, permissions, CDN invalidation |
| Responsive breakpoints | Custom `window.matchMedia` listeners | Tailwind v4 responsive prefixes (`sm:`, `md:`, `lg:`) | Compile-time CSS; no JS runtime cost |

**Key insight:** Every "infrastructure" problem in this phase has an official, maintained solution. The value of Phase 1 is correct wiring, not custom code.

---

## Common Pitfalls

### Pitfall 1: PWA Manifest/SW Served from Wrong URL on GitHub Pages

**What goes wrong:** The app is installable in development but fails on GitHub Pages. Browser can't find `/manifest.webmanifest` or `/sw.js` because the actual paths are `/PathfinderDiceRoller/manifest.webmanifest`.
**Why it happens:** `@vite-pwa/sveltekit` has its own `base` option separate from `kit.paths.base`. Both must be set.
**How to avoid:** Set `base: '/PathfinderDiceRoller/'` inside `SvelteKitPWA({})` in `vite.config.ts`, in addition to `paths.base` in `svelte.config.js`.
**Warning signs:** DevTools Application tab shows "Service worker not registered" or "Manifest could not be fetched" after deployment.

### Pitfall 2: Offline Fails on Second Page Load (HTML Not Cached)

**What goes wrong:** App works after install but shows network error on reload when offline.
**Why it happens:** Without `export const prerender = true` in `+layout.ts`, SvelteKit generates HTML dynamically. The Workbox glob patterns only match prerendered HTML files in the build output — no prerendering = no HTML in cache.
**How to avoid:** Add `export const prerender = true` to `src/routes/+layout.ts`. This forces SvelteKit to emit static HTML during build.
**Warning signs:** Works with network, fails without. Workbox cache in DevTools shows JS/CSS but no `.html` entries.

### Pitfall 3: Dexie SSR Crash During Build

**What goes wrong:** `npm run build` fails with `ReferenceError: indexedDB is not defined`.
**Why it happens:** SvelteKit prerenders pages on Node.js. Any code that imports `db` and runs at module evaluation time will try to open IndexedDB in Node, which doesn't exist.
**How to avoid:** Import `browser` from `$app/environment`; guard all Dexie operations. Never call `db.*` at module top level — only inside `onMount`, reactive statements, or event handlers.
**Warning signs:** Build succeeds in dev but fails during `npm run build`.

### Pitfall 4: iOS Safari Storage Eviction

**What goes wrong:** User's character data disappears after a week of not opening the app.
**Why it happens:** iOS Safari evicts non-persisted IndexedDB data aggressively (as little as 7 days of inactivity).
**How to avoid:** Call `navigator.storage.persist()` on first app open (guarded by `browser` check). This requests persistent storage designation — iOS will show a permission prompt.
**Warning signs:** User reports "my character disappeared" after a gap in usage.

### Pitfall 5: Tailwind v4 Classes Not Applied in Svelte Components

**What goes wrong:** Utility classes appear in the HTML but have no effect.
**Why it happens:** v4 requires the `@tailwindcss/vite` plugin, not PostCSS. If the old PostCSS approach is used alongside, or the plugin order is wrong in `vite.config.ts`, styles won't compile.
**How to avoid:** `tailwindcss()` must appear in the `plugins` array before `sveltekit()`. No `tailwind.config.js` or `postcss.config.js` needed in v4.
**Warning signs:** No CSS output for Tailwind classes in the browser; classes appear in DOM but nothing rendered.

### Pitfall 6: `paths.base` Not Applied to Internal Links

**What goes wrong:** Navigation between tabs results in 404 on GitHub Pages.
**Why it happens:** Raw `<a href="/roll">` links ignore `paths.base`. On GitHub Pages the app is at `/PathfinderDiceRoller/roll`, not `/roll`.
**How to avoid:** Use SvelteKit's `base` import from `$app/paths` for all internal hrefs: `<a href="{base}/roll">`. Or use `<a href="/roll">` with `goto()` — SvelteKit router handles base path in JS navigation. Best: use `<a href="/roll">` only inside SvelteKit route components; they get base-prefixed automatically via the router.
**Warning signs:** Tab links work in dev but 404 after deploying.

---

## Code Examples

Verified patterns from official sources:

### TabBar Component Shell

```svelte
<!-- src/lib/components/layout/TabBar.svelte -->
<script lang="ts">
  import { page } from '$app/state';
  import { base } from '$app/paths';

  const tabs = [
    { label: 'Character', href: `${base}/character`, icon: '👤' },
    { label: 'Roll', href: `${base}/roll`, icon: '🎲' },
    { label: 'History', href: `${base}/history`, icon: '📜' }
  ];
</script>

<nav class="flex border-t border-surface-raised bg-surface-base safe-area-inset-bottom">
  {#each tabs as tab}
    <a
      href={tab.href}
      class="flex flex-1 flex-col items-center justify-center py-2 min-h-[var(--tap-target-min)]
             text-text-muted aria-[current=page]:text-accent transition-colors"
      aria-current={page.url.pathname.startsWith(tab.href) ? 'page' : undefined}
    >
      <span class="text-xl" aria-hidden="true">{tab.icon}</span>
      <span class="text-xs mt-0.5">{tab.label}</span>
    </a>
  {/each}
</nav>
```

### Dexie liveQuery in Svelte 5

```svelte
<script lang="ts">
  import { browser } from '$app/environment';
  import { db } from '$lib/db';
  import { liveQuery } from 'dexie';

  // Only run liveQuery in browser; return empty array during SSR prerender
  const characters = browser
    ? liveQuery(() => db.characters.orderBy('importedAt').toArray())
    : { subscribe: (fn: (v: never[]) => void) => { fn([]); return () => {}; } };
</script>

{#each $characters ?? [] as char (char.id)}
  <p>{char.name}</p>
{/each}
```

### PWA Manifest Link (root layout)

```svelte
<script lang="ts">
  import { pwaInfo } from 'virtual:pwa-info';
  $: webManifestLink = pwaInfo ? pwaInfo.webManifest.linkTag : '';
</script>

<svelte:head>
  {@html webManifestLink}
</svelte:head>
```

### navigator.storage.persist() Call Pattern

```typescript
// Call from +layout.svelte onMount
import { onMount } from 'svelte';
import { browser } from '$app/environment';
import { requestPersistentStorage } from '$lib/db/persistence';

onMount(async () => {
  if (browser) {
    await requestPersistentStorage();
  }
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind with `tailwind.config.js` + PostCSS | `@tailwindcss/vite` plugin, `@theme` in CSS | Tailwind v4 (2025) | No config file; CSS variables are first-class |
| `export let` props in Svelte | `let { x } = $props()` runes | Svelte 5 (2024) | Explicit reactivity; better TypeScript inference |
| Svelte 4 `$:` reactive declarations | `$derived()` and `$effect()` runes | Svelte 5 (2024) | Runes are explicit; no implicit dependencies |
| Workbox via vite-plugin-pwa only | `@vite-pwa/sveltekit` wrapper | 2023 | SvelteKit-aware glob patterns; handles prerendered routes |
| jsdom for component testing | Vitest browser mode (stable v4) | Vitest 4.0 (Dec 2025) | Real browser APIs; no fake-indexeddb needed |

**Deprecated/outdated:**
- `$store` syntax still works in Svelte 5 but Dexie's `liveQuery` returns a subscribable — use `$liveQuery` or convert to `$state` with `$effect`
- `tailwind.config.js`: Not needed in v4; delete if scaffolded

---

## Open Questions

1. **`svelte.config.js` service worker registration conflict**
   - What we know: The docs say to set `serviceWorker: { register: false }` in svelte.config.js to avoid double-registration
   - What's unclear: Whether `npx sv create` scaffolds with this already set, or if it must be added manually
   - Recommendation: Verify after scaffolding; add the config explicitly in Wave 0

2. **iOS Safari `navigator.storage.persist()` prompt behavior**
   - What we know: iOS grants persistent storage only when the PWA is added to the Home Screen, not when browsing in Safari
   - What's unclear: Whether the permission dialog appears at all, or is silently ignored
   - Recommendation: Call it anyway (never crashes), and document the data export option prominently in the UI as the real safety net

3. **Vitest browser mode and SvelteKit build integration**
   - What we know: Vitest 4 browser mode with Playwright is stable; requires separate config from vite.config.ts for SvelteKit
   - What's unclear: Whether `vitest.config.ts` can import `sveltekit()` plugin without triggering full SvelteKit build
   - Recommendation: Use `extends: true` pattern shown in Pattern 8; if issues arise, create a dedicated `vitest.config.ts` that does NOT extend `vite.config.ts`

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (browser mode) + Playwright |
| Config file | `vitest.config.ts` — Wave 0 creates this |
| Quick run command | `npx vitest run --project browser --reporter=dot` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAT-01 | Build output exists in `build/` and contains `index.html` | smoke | `npm run build && test -f build/index.html` | Wave 0 |
| PLAT-02 | `manifest.webmanifest` and `sw.js` present in build output | smoke | `test -f build/manifest.webmanifest && test -f build/sw.js` | Wave 0 |
| PLAT-03 | Service worker precaches all app shell assets | browser | `npx vitest run --project browser src/lib/db/db.browser.test.ts` | Wave 0 |
| PLAT-04 | Layout renders without horizontal overflow on 375px viewport | browser | `npx vitest run --project browser src/lib/components/layout/layout.browser.test.ts` | Wave 0 |
| PLAT-05 | `db.settings.add()` and `db.settings.get()` persist across Dexie re-open | browser | `npx vitest run --project browser src/lib/db/db.browser.test.ts` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run --project browser --reporter=dot`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/lib/db/db.browser.test.ts` — covers PLAT-03, PLAT-05 (Dexie persistence + SW cache check)
- [ ] `src/lib/components/layout/layout.browser.test.ts` — covers PLAT-04 (responsive layout)
- [ ] `vitest.config.ts` — browser mode + unit mode project split
- [ ] `vitest-setup-browser.ts` — `@vitest/browser/matchers` type reference
- [ ] Framework install: `npx playwright install chromium` — required for browser provider

---

## Sources

### Primary (HIGH confidence)

- [vite-pwa-org.netlify.app/frameworks/sveltekit](https://vite-pwa-org.netlify.app/frameworks/sveltekit) — plugin config, glob patterns, SvelteKit integration
- [tailwindcss.com/docs/guides/sveltekit](https://tailwindcss.com/docs/guides/sveltekit) — v4 Vite plugin setup, official guide
- [dexie.org/docs/Typescript](https://dexie.org/docs/Typescript) — class-based schema, Table generics, versioning
- [vitest.dev/guide/browser/](https://vitest.dev/guide/browser/) — browser mode config, Playwright provider, v4 stable status

### Secondary (MEDIUM confidence)

- [github.com/vite-pwa/sveltekit/issues/36](https://github.com/vite-pwa/sveltekit/issues/36) — base path workaround for GitHub Pages subdirectories (community-verified)
- [svelte.dev/docs/kit/adapter-static](https://svelte.dev/docs/kit/adapter-static) — static adapter + prerender config
- [infoq.com/news/2025/12/vitest-4-browser-mode/](https://www.infoq.com/news/2025/12/vitest-4-browser-mode/) — Vitest 4 stable browser mode release announcement

### Tertiary (LOW confidence)

- Multiple community blog posts on SvelteKit + GitHub Pages deploy workflow — cross-verified against official docs, confident in workflow YAML shape

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against official sources; Tailwind v4 and Vitest v4 both confirmed stable as of late 2025
- Architecture: HIGH — patterns sourced from official documentation with official code examples
- PWA base path pitfall: MEDIUM — documented in GitHub issue tracker with community workaround; official docs don't call it out explicitly
- Pitfalls: HIGH for SSR/Dexie, MEDIUM for iOS storage behavior
- Test setup: MEDIUM — Vitest 4 browser mode is stable but SvelteKit integration specifics benefit from post-scaffold verification

**Research date:** 2026-03-14
**Valid until:** 2026-06-14 (90 days — stable ecosystem; Tailwind, Dexie, and SvelteKit move deliberately)
