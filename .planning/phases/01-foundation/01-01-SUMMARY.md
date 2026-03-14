---
phase: 01-foundation
plan: 01
subsystem: infra
tags: [sveltekit, svelte5, tailwindcss-v4, vite-pwa, vitest, playwright, dexie, github-pages, pwa]

requires: []

provides:
  - SvelteKit 2 + Svelte 5 project scaffold with npm, TypeScript strict mode
  - Static adapter configured with /PathfinderDiceRoller base path for GitHub Pages
  - Tailwind CSS v4 via @tailwindcss/vite plugin (no tailwind.config.js)
  - PWA plugin with Workbox generateSW strategy and correct base path
  - Vitest 4 browser mode with Playwright/Chromium for IndexedDB and crypto tests
  - Dexie v4 installed and available for future phase use
  - Semantic CSS theme tokens (surface, text, accent colors) in src/app.css
  - Build output: build/index.html + manifest.webmanifest + sw.js

affects:
  - 01-02 (app shell layout — builds on routing structure established here)
  - all subsequent phases (depend on buildable project and test infrastructure)

tech-stack:
  added:
    - "@sveltejs/kit@^2.0.0"
    - "svelte@^5.0.0"
    - "@sveltejs/adapter-static@^3.0.0"
    - "tailwindcss@^4.0.0"
    - "@tailwindcss/vite@^4.0.0"
    - "@vite-pwa/sveltekit@^1.0.0"
    - "vitest@^4.0.0"
    - "@vitest/browser@^4.0.0"
    - "@vitest/browser-playwright@^4.1.0"
    - "playwright@^1.40.0"
    - "dexie@^4.0.0"
    - "vite@^6.0.0"
  patterns:
    - "Tailwind v4: @import 'tailwindcss' + @theme block in app.css — no config file"
    - "Svelte 5 runes: $props() instead of export let, {@render children()} in layouts"
    - "Vitest browser config: use svelte() not sveltekit() to avoid base path override"
    - "Vitest v4 provider API: playwright() factory call, not string 'playwright'"
    - "Conditional base path: dev='' prod='/PathfinderDiceRoller' in svelte.config.js"

key-files:
  created:
    - svelte.config.js
    - vite.config.ts
    - vitest.config.ts
    - vitest-setup-browser.ts
    - src/app.css
    - src/app.html
    - src/routes/+layout.ts
    - src/routes/+layout.svelte
    - src/routes/+page.svelte
    - src/lib/smoke.browser.test.ts
    - static/.nojekyll
    - static/favicon.png
    - static/icons/icon-192.png
    - static/icons/icon-512.png
    - package.json
    - tsconfig.json
    - .gitignore
  modified: []

key-decisions:
  - "Use svelte() not sveltekit() in vitest.config.ts — sveltekit() overrides base to /PathfinderDiceRoller/ breaking Vitest browser UI asset paths"
  - "Vitest v4.1 requires playwright() factory call (returns object with serverFactory) not string 'playwright' as provider"
  - "SvelteKitPWA base path must include trailing slash: '/PathfinderDiceRoller/' vs svelte.config.js paths.base '/PathfinderDiceRoller' (no slash)"
  - "Static favicon.png required at /static/favicon.png or prerender fails with 404 during build"

patterns-established:
  - "Tailwind v4 pattern: @import 'tailwindcss' + @theme block; no tailwind.config.js, no postcss.config.js"
  - "Svelte 5 pattern: $props() runes only; no export let; {@render children()} for slot equivalent"
  - "Test pattern: *.browser.test.ts for browser tests, *.unit.test.ts for node tests"
  - "Build pattern: npm run build produces static site to build/ for GitHub Pages via adapter-static"

requirements-completed: [PLAT-01, PLAT-02, PLAT-03]

duration: 11min
completed: 2026-03-14
---

# Phase 1 Plan 1: Foundation Scaffold Summary

**SvelteKit 2 + Svelte 5 static PWA scaffold with Tailwind v4, Workbox service worker, and Vitest 4 Playwright browser mode — builds to GitHub Pages-ready output with IndexedDB tests passing**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-14T19:54:01Z
- **Completed:** 2026-03-14T20:04:44Z
- **Tasks:** 3
- **Files modified:** 17

## Accomplishments

- SvelteKit 2 + Svelte 5 project scaffolded from scratch with all dependencies installed
- Build pipeline verified: `npm run build` produces `build/index.html`, `build/manifest.webmanifest`, and `build/sw.js`
- Vitest 4 browser mode operational: Playwright/Chromium smoke tests confirm IndexedDB and crypto.getRandomValues available

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold SvelteKit project and install all dependencies** — `b9a9d8b` (feat)
2. **Task 2: Configure Vite, Tailwind, PWA plugin, and app entry files** — `d2b9f68` (feat)
3. **Task 3: Configure Vitest browser mode test infrastructure** — `ad0864a` (feat)

**Plan metadata:** _(pending — this summary commit)_

## Files Created/Modified

- `svelte.config.js` — adapter-static with conditional base path (/PathfinderDiceRoller in prod, '' in dev)
- `vite.config.ts` — tailwindcss() BEFORE sveltekit() (Tailwind v4 requirement) + SvelteKitPWA with base path
- `vitest.config.ts` — browser project (Playwright/Chromium) + unit project (node), uses svelte() not sveltekit()
- `vitest-setup-browser.ts` — @vitest/browser/matchers reference types
- `src/app.css` — @import "tailwindcss" + @theme tokens (surface, text, accent palette)
- `src/app.html` — viewport meta + theme-color meta tag
- `src/routes/+layout.ts` — prerender = true for full offline caching
- `src/routes/+layout.svelte` — minimal layout using $props() runes, imports app.css
- `src/routes/+page.svelte` — placeholder page using Tailwind theme tokens
- `src/lib/smoke.browser.test.ts` — IndexedDB and crypto smoke tests (both passing)
- `static/.nojekyll` — prevents GitHub Pages Jekyll processing
- `static/favicon.png` — 32x32 placeholder icon
- `static/icons/icon-192.png` — PWA icon placeholder (Pathfinder accent red)
- `static/icons/icon-512.png` — PWA icon placeholder (Pathfinder accent red)
- `package.json` — all dependencies declared including test scripts
- `tsconfig.json` — strict TypeScript configuration
- `.gitignore` — node_modules, build artifacts, .svelte-kit

## Decisions Made

- Used `svelte()` instead of `sveltekit()` in vitest.config.ts — the SvelteKit plugin overrides Vite's `base` config to the repo path, causing Vitest's browser UI assets (JS/CSS) to 404 at `/PathfinderDiceRoller/__vitest__/...`
- Vitest v4.1 changed the provider API: `provider` must be the result of calling `playwright()` (returns an object with `serverFactory`), not a string `'playwright'` or the `playwright` function reference itself
- SvelteKitPWA base includes trailing slash: `'/PathfinderDiceRoller/'` — matches SvelteKit paths.base `'/PathfinderDiceRoller'` (no trailing slash in svelte.config.js, slash required in PWA plugin)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added static/favicon.png — build 404'd on missing favicon**
- **Found during:** Task 2 (build verification)
- **Issue:** app.html references `%sveltekit.assets%/favicon.png` which becomes a prerender request during build; missing file causes 404 error that aborts build
- **Fix:** Generated a minimal 32x32 PNG (Pathfinder red #e94560) using Node.js zlib PNG encoder
- **Files modified:** static/favicon.png
- **Verification:** `npm run build` completes successfully after addition
- **Committed in:** d2b9f68 (Task 2 commit)

**2. [Rule 1 - Bug] Changed provider string to playwright() factory call (Vitest v4 API)**
- **Found during:** Task 3 (first vitest run attempt)
- **Issue:** Vitest v4 changed browser provider API — string `'playwright'` throws "changed to accept a factory instead of a string"
- **Fix:** Imported `playwright` from `@vitest/browser-playwright` and called as `playwright()` in config
- **Files modified:** vitest.config.ts
- **Verification:** Smoke tests pass
- **Committed in:** ad0864a (Task 3 commit)

**3. [Rule 3 - Blocking] Installed @vitest/browser-playwright package**
- **Found during:** Task 3 (after fixing provider string)
- **Issue:** Package not in package.json but required for Vitest v4 browser provider factory API
- **Fix:** `npm install -D @vitest/browser-playwright`
- **Files modified:** package.json, package-lock.json
- **Verification:** Import resolves, provider initializes correctly
- **Committed in:** ad0864a (Task 3 commit)

**4. [Rule 1 - Bug] Used svelte() instead of sveltekit() in vitest.config.ts**
- **Found during:** Task 3 (second vitest run — browser UI 404s)
- **Issue:** `sveltekit()` plugin overrides Vite `base` config to `/PathfinderDiceRoller/`, causing Vitest browser UI assets to 404 at that path prefix in test mode
- **Fix:** Switched to `svelte({ hot: !process.env.VITEST })` from `@sveltejs/vite-plugin-svelte`
- **Files modified:** vitest.config.ts
- **Verification:** Browser tests start and pass (no more 404 errors for vitest assets)
- **Committed in:** ad0864a (Task 3 commit)

---

**Total deviations:** 4 auto-fixed (1 Rule 3 blocking, 2 Rule 1 bugs, 1 Rule 3 blocking)
**Impact on plan:** All auto-fixes necessary for correctness. Three were Vitest v4 API changes vs what the plan was written for. No scope creep.

## Issues Encountered

The plan was written for Vitest v3 syntax (`provider: 'playwright'` string). Vitest v4 (latest at time of execution) requires the factory pattern from `@vitest/browser-playwright`. This is a common version drift issue for greenfield projects — documented above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Build pipeline fully operational for Plan 01-02 (app shell layout)
- Vitest browser infrastructure ready for component tests in all subsequent plans
- Dexie v4 installed, ready for schema definition in Plan 01-03 or later
- Theme token names (`--color-surface-base`, `--color-accent`, etc.) established for consistency

No blockers for Phase 1 Plan 2.

## Self-Check: PASSED

All files verified present. All task commits verified in git history.

- b9a9d8b: Task 1 (scaffold + deps) — FOUND
- d2b9f68: Task 2 (vite, tailwind, PWA, routes) — FOUND
- ad0864a: Task 3 (vitest browser mode) — FOUND
- build/index.html, manifest.webmanifest, sw.js — FOUND
- .planning/phases/01-foundation/01-01-SUMMARY.md — FOUND

---
*Phase: 01-foundation*
*Completed: 2026-03-14*
