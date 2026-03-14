---
phase: 01-foundation
plan: 02
subsystem: ui
tags: [sveltekit, svelte5, dexie, indexeddb, tailwindcss-v4, pwa, vitest, playwright, layout, routing]

# Dependency graph
requires:
  - phase: 01-01
    provides: SvelteKit scaffold, Vitest browser mode, Tailwind v4 theme tokens, Dexie installed

provides:
  - Dexie AppDatabase class with characters, rollHistory, settings, heroPoints stores (singleton exported as db)
  - requestPersistentStorage() function guarded by browser check, deduplicates via settings table
  - TabBar component: bottom nav with 3 tabs (Character/Roll/History), aria-current active state, safe-area-inset-bottom padding
  - DiceTray component: sticky placeholder bar shell (Phase 4 content)
  - RollResultCard component: empty shell for persistent last-roll display (Phase 4)
  - Root layout: full-height flex column, scrollable main, PWA manifest injection, onMount persistence request
  - Three route pages: /character, /roll, /history with placeholder content
  - Root page redirects to /character via goto()
  - SvelteKit $app/* stub modules for vitest browser mode (Vite resolve aliases)
  - Browser tests: DB round-trip (5 tests) + layout tests (4 tests)

affects:
  - 01-03 (any further foundation work)
  - 02 (character import — depends on db.characters, db.settings, TabBar active routing)
  - 03 (rules engine — depends on db schema interfaces)
  - 04 (roll UI — fills in DiceTray and RollResultCard shells, uses db.rollHistory)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SvelteKit $app/* stubs: add Vite resolve aliases in vitest.config.ts pointing to src/test-stubs/*.ts files so svelte() plugin can resolve virtual modules"
    - "Svelte 5 layout: h-dvh flex flex-col + flex-1 overflow-y-auto for full-height mobile layout without extra JS"
    - "safe-area-inset-bottom: use inline style env(safe-area-inset-bottom) in TabBar for notched phone support"
    - "$derived() for PWA manifest link: const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '')"

key-files:
  created:
    - src/lib/db/index.ts
    - src/lib/db/persistence.ts
    - src/lib/db/db.browser.test.ts
    - src/lib/components/layout/TabBar.svelte
    - src/lib/components/layout/DiceTray.svelte
    - src/lib/components/layout/RollResultCard.svelte
    - src/lib/components/layout/layout.browser.test.ts
    - src/routes/character/+page.svelte
    - src/routes/roll/+page.svelte
    - src/routes/history/+page.svelte
    - src/test-stubs/app-state.ts
    - src/test-stubs/app-paths.ts
    - src/test-stubs/app-environment.ts
    - src/test-stubs/app-navigation.ts
  modified:
    - src/routes/+layout.svelte
    - src/routes/+page.svelte
    - vitest.config.ts

key-decisions:
  - "SvelteKit $app/* stubs via Vite resolve aliases in vitest.config.ts — svelte() plugin does not resolve virtual $app modules; aliases pointing to src/test-stubs/ files fix this cleanly without breaking the build"
  - "Added dexie to vitest optimizeDeps.include — prevents Vite from reloading mid-test when Dexie is first imported, eliminating flaky test warnings"
  - "Used $derived() for webManifestLink in +layout.svelte — plan example showed $: reactive declaration (Svelte 4 syntax); updated to Svelte 5 runes per plan's own CRITICAL note"

patterns-established:
  - "Stub pattern: src/test-stubs/$app-*.ts files aliased in vitest.config.ts for all future component tests needing SvelteKit navigation/state APIs"
  - "Layout pattern: h-dvh flex flex-col root div, flex-1 overflow-y-auto main, then fixed bottom chrome components in order: RollResultCard → DiceTray → TabBar"

requirements-completed: [PLAT-04, PLAT-05]

# Metrics
duration: 6min
completed: 2026-03-14
---

# Phase 1 Plan 2: App Shell Layout + Dexie DB Summary

**Bottom-tab app shell (Character/Roll/History) with Dexie IndexedDB schema (4 stores), PWA manifest injection, storage persistence, and Vitest $app/* stub pattern for component tests**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-14T20:07:58Z
- **Completed:** 2026-03-14T20:13:39Z
- **Tasks:** 2
- **Files modified:** 17

## Accomplishments

- Dexie AppDatabase class with all 4 stores (characters, rollHistory, settings, heroPoints) and typed TypeScript interfaces, with storage persistence function
- Full app shell layout: three-tab bottom navigation, sticky dice tray placeholder, roll result card shell, scrollable content area — all wired into root layout with PWA manifest and onMount persistence call
- 11 browser tests passing (5 DB round-trip + 4 layout/TabBar) with SvelteKit virtual module resolution fixed via Vite aliases

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Dexie database schema and storage persistence** - `783d677` (feat)
2. **Task 2: Build layout components and route pages** - `84707d4` (feat)

**Plan metadata:** _(this commit)_

## Files Created/Modified

- `src/lib/db/index.ts` — AppDatabase class, Character/RollHistoryEntry/Settings/HeroPoint interfaces, db singleton export
- `src/lib/db/persistence.ts` — requestPersistentStorage() with browser guard and settings-table deduplication
- `src/lib/db/db.browser.test.ts` — 5 browser tests: DB opens, settings round-trip, character round-trip, persistence across reopen, roll history round-trip
- `src/lib/components/layout/TabBar.svelte` — bottom nav with 3 tabs, aria-current active state, safe-area-inset-bottom padding
- `src/lib/components/layout/DiceTray.svelte` — sticky placeholder container (Phase 4)
- `src/lib/components/layout/RollResultCard.svelte` — empty shell for last-roll display (Phase 4)
- `src/lib/components/layout/layout.browser.test.ts` — 4 browser tests: 3 tabs rendered, correct labels, aria-current, no horizontal overflow
- `src/routes/+layout.svelte` — full layout with PWA manifest, onMount persistence, TabBar/DiceTray/RollResultCard
- `src/routes/+page.svelte` — redirects to /character via goto()
- `src/routes/character/+page.svelte` — Character tab placeholder
- `src/routes/roll/+page.svelte` — Roll tab placeholder
- `src/routes/history/+page.svelte` — History tab placeholder
- `src/test-stubs/app-state.ts` — $app/state stub (page with pathname)
- `src/test-stubs/app-paths.ts` — $app/paths stub (base = '')
- `src/test-stubs/app-environment.ts` — $app/environment stub (browser = true)
- `src/test-stubs/app-navigation.ts` — $app/navigation stub (goto, etc.)
- `vitest.config.ts` — added resolve.alias for $app/* stubs + optimizeDeps.include dexie

## Decisions Made

- Used `$derived()` for `webManifestLink` in the root layout (not `$:` from Svelte 4) — the plan's own CRITICAL note specified Svelte 5 runes, and the example code in the research doc still used `$:` which would have been a syntax mismatch
- Added Vite resolve aliases for `$app/state`, `$app/paths`, `$app/environment`, `$app/navigation` pointing to stub files in `src/test-stubs/` — the plain `svelte()` Vitest plugin cannot resolve SvelteKit virtual modules; stub files are lightweight and keep the build config clean
- Added `dexie` to `vitest optimizeDeps.include` — Vitest warned about mid-test reloads when Dexie was first imported; pre-bundling eliminates this flakiness

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added Vite resolve aliases for $app/* virtual modules in vitest.config.ts**
- **Found during:** Task 2 (first layout browser test run)
- **Issue:** `vi.mock('$app/state', ...)` runs at JS level but Vite's transform rejects the import before the mock can intercept — `Failed to resolve import "$app/state" from TabBar.svelte` at pre-transform phase
- **Fix:** Created `src/test-stubs/app-*.ts` stub files and added `resolve.alias` entries in vitest.config.ts mapping all four `$app/*` modules to stubs
- **Files modified:** vitest.config.ts, src/test-stubs/app-state.ts, src/test-stubs/app-paths.ts, src/test-stubs/app-environment.ts, src/test-stubs/app-navigation.ts
- **Verification:** All 11 browser tests pass including layout tests that import TabBar which uses $app/state and $app/paths
- **Committed in:** 84707d4 (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added dexie to vitest optimizeDeps.include**
- **Found during:** Task 1 (first DB browser test run)
- **Issue:** Vitest warned "Vite unexpectedly reloaded a test. This may cause tests to fail, lead to flaky behaviour or duplicated test runs" and suggested adding dexie to optimizeDeps.include
- **Fix:** Added `optimizeDeps: { include: ['dexie'] }` to vitest.config.ts
- **Files modified:** vitest.config.ts
- **Verification:** No more reload warning on subsequent test runs
- **Committed in:** 783d677 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 3 blocking, 1 Rule 2 missing critical config)
**Impact on plan:** Both auto-fixes required for test correctness and stability. The $app/* stub pattern is reusable across all future component tests — establishing a clean pattern for the project.

## Issues Encountered

The plan called for using `$app/state` and `$app/paths` directly in TabBar — correct for production SvelteKit, but the Vitest config uses `svelte()` not `sveltekit()` (per Phase 01-01 decision to avoid base path override). This means SvelteKit virtual modules don't resolve during tests. The stub approach is the cleanest solution and matches how the codebase's separation between test and production runtime was already established.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- App shell fully navigable with three tabs
- Dexie database ready for character import in Phase 2 (db.characters table with Character interface)
- Stub pattern established — future component tests with $app/* imports just work
- DiceTray and RollResultCard are shells waiting for Phase 4 content
- No blockers for Phase 1 Plan 3 (if any) or Phase 2

## Self-Check: PASSED

- src/lib/db/index.ts — FOUND
- src/lib/db/persistence.ts — FOUND
- src/lib/db/db.browser.test.ts — FOUND
- src/lib/components/layout/TabBar.svelte — FOUND
- src/lib/components/layout/DiceTray.svelte — FOUND
- src/lib/components/layout/RollResultCard.svelte — FOUND
- src/lib/components/layout/layout.browser.test.ts — FOUND
- src/routes/+layout.svelte — FOUND
- src/routes/character/+page.svelte — FOUND
- src/routes/roll/+page.svelte — FOUND
- src/routes/history/+page.svelte — FOUND
- 783d677: Task 1 (Dexie DB schema + persistence) — FOUND
- 84707d4: Task 2 (layout components + routes) — FOUND
- All 11 browser tests PASSING
- npm run build PASSING

---
*Phase: 01-foundation*
*Completed: 2026-03-14*
