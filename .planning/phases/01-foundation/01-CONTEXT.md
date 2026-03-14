# Phase 1: Foundation - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

SvelteKit 2 + Svelte 5 PWA shell with Tailwind CSS v4, IndexedDB via Dexie v4, GitHub Pages deployment pipeline, and responsive layout skeleton. This phase produces a deployable, installable, offline-capable app shell — no feature code yet.

</domain>

<decisions>
## Implementation Decisions

### App Shell Layout
- Bottom tab navigation: three tabs — Character, Roll, History
- On mobile: tabs at bottom of screen, swipe/tap between views
- On desktop: same tab structure can expand (but tabs remain the primary nav)
- Sticky dice tray bar always visible at the bottom of the screen (above tabs on mobile) — quick-access rolling from any view
- Roll result appears as a persistent card above the dice tray — stays visible until next roll replaces it
- Roll history lives in its own dedicated History tab — full scrollable log
- Adaptive layout: tabs on mobile, potential sidebar expansion on desktop (Claude's discretion on breakpoint behavior)

### Deployment & Hosting
- GitHub username: `zwemvest`, repo: `PathfinderDiceRoller`
- GitHub Pages URL: `zwemvest.github.io/PathfinderDiceRoller`
- SvelteKit `paths.base` must be set to `/PathfinderDiceRoller`
- GitHub Actions CI/CD: auto-build and deploy on push to `main`
- Trunk-based development: push directly to `main`, no feature branches

### Offline & Storage
- IndexedDB via Dexie v4 with separate stores per entity type: `characters`, `rollHistory`, `settings`, `heroPoints`
- Full precache strategy — all assets cached on first load for complete offline support (table use case)
- Request `navigator.storage.persist()` on first app use to prevent iOS Safari data eviction
- Additionally offer data export option as a safety net for iOS users
- PWA via `@vite-pwa/sveltekit` with Workbox `generateSW` strategy

### Dev Environment
- Package manager: npm
- Linting: ESLint (code quality)
- Formatting: Prettier
- Testing: Vitest 4 Browser Mode (real browser — needed for IndexedDB, crypto.getRandomValues, service worker tests)
- TypeScript: strict mode (SvelteKit default)

### Claude's Discretion
- Exact Tailwind theme token structure (foundations for the three-theme system come later, but token naming in Phase 1 should be forward-compatible)
- Desktop breakpoint layout expansion behavior
- ESLint rule configuration (standard SvelteKit preset is fine)
- GitHub Actions workflow specifics (standard SvelteKit static adapter deploy)
- Dexie schema version strategy
- Exact responsive breakpoints

</decisions>

<specifics>
## Specific Ideas

- The dice tray should feel like a chat input bar — always at the bottom, always accessible, part of the muscle memory
- Roll result card is persistent (not a toast) — you glance down and your last roll is right there
- The app should feel native on a phone at a gaming table — big tap targets, no tiny buttons

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing code — greenfield project
- Sample character JSON files in repo root: `Foundry-Knurvik.json`, `Pathbuilder-Kairos.json` (reference for Phase 2, not used in Phase 1)

### Established Patterns
- No existing patterns — Phase 1 establishes all conventions

### Integration Points
- Phase 1 creates the shell that all subsequent phases build into
- Tab structure must accommodate: Character view (Phase 2+), Roll view (Phase 4+), History view (Phase 4+)
- Dexie schema must be designed for forward-compatibility with character import (Phase 2) and roll history (Phase 4)
- Sticky dice tray is the integration point for all rolling features (Phases 3-7)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-14*
