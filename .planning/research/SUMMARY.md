# Project Research Summary

**Project:** Pathfinder Dice Roller
**Domain:** Client-side PWA — PF2e character-sheet-integrated dice roller (GitHub Pages)
**Researched:** 2026-03-14
**Confidence:** HIGH

## Executive Summary

This is a PF2e-specific dice roller PWA that imports character data from Pathbuilder or Foundry VTT JSON and provides click-to-roll functionality with full PF2e rules fidelity — degree of success, bonus type stacking, MAP tracking, and hero point rerolls. The competitive landscape has a clear gap: Pathbuilder has the largest PF2e user base but lacks a roll log, MAP UI, degree-of-success display, and hero point support. D&D Beyond shows what polished click-to-roll looks like but is D&D 5e-only. Foundry VTT PF2e sets the feature ceiling but requires server setup. This project can deliver Foundry-level PF2e rules fidelity in an offline-capable, installable PWA that works on a phone at the table — a gap none of the three competitors fill.

The recommended stack is SvelteKit 2 + Svelte 5 + Tailwind CSS v4 + Dexie.js + `@dice-roller/rpg-dice-roller` deployed to GitHub Pages via `adapter-static`. All versions are current and verified. The architecture is a clean layered design: a JSON import pipeline normalising two character formats into a single internal schema, a pure-function rules engine (modifiers, MAP, degree of success, dice), Svelte 5 runes for reactive state, and Dexie for IndexedDB persistence. The service worker via `@vite-pwa/sveltekit` handles offline and install. This stack has no integration conflicts and all libraries are actively maintained.

The critical risks are rules-engine correctness, not technical infrastructure. PF2e has non-obvious rules around degree-of-success order of operations, typed bonus stacking, deadly/fatal critical damage formulas, and MAP per-weapon derivation. Getting any of these wrong silently produces incorrect rolls — the core value proposition. The Foundry JSON import also requires re-deriving skill totals from raw components (the exported `system.skills` is empty), and Pathbuilder spells contain only names with no damage data. These pitfalls are well-documented and each has a clear prevention strategy; the risk is known and manageable if addressed in the right phase.

---

## Key Findings

### Recommended Stack

SvelteKit 2 with `adapter-static` is the right framework choice for this project. It produces a fully prerendered static bundle compatible with GitHub Pages, integrates natively with `@vite-pwa/sveltekit` for Workbox-based service worker generation, and Svelte 5's runes API (`$state`, `$derived`, `$effect`) provides fine-grained reactivity for complex state (MAP tracking, roll history, multi-character GM mode) with zero virtual DOM overhead — critical for 60fps dice animations on mobile. Tailwind CSS v4's CSS-first `@theme` directive makes the three-theme requirement (parchment / Pathfinder brand / modern) trivial: define tokens per `[data-theme]` selector and toggle via `document.documentElement.dataset.theme`. All package versions are current and verified against npm.

**Core technologies:**
- **SvelteKit 2 + Svelte 5** (`^2.55.0` / `^5.53.11`): App framework and component model — zero-runtime compiled output, runes API ideal for complex reactive state
- **Tailwind CSS v4** (`^4.2.1`): Styling — CSS-first `@theme` makes three switchable themes trivial with no runtime cost
- **Dexie.js** (`^4.3.0`): IndexedDB ORM — async/await first, versioned schema migrations, TypeScript generics; essential for character sheets, roll history, and settings
- **`@dice-roller/rpg-dice-roller`** (`^5.5.1`): Dice notation parsing — handles `3d6`, `4d6dh1`, `2d20kl1`; MIT licensed; build PF2e modifier logic on top, not as a replacement
- **`@vite-pwa/sveltekit`** (`^1.1.0`): PWA — service worker, manifest, Workbox offline caching designed specifically for SvelteKit static builds
- **`@sveltejs/adapter-static`** (`^3.x`): GitHub Pages output — `fallback: '404.html'` for client-side routing

**Critical version notes:**
- Do NOT use the unscoped `rpg-dice-roller` package (unmaintained); use `@dice-roller/rpg-dice-roller`
- Do NOT use `localStorage` for character data (5MB cap, synchronous, no queries)
- Do NOT use `jest + jsdom` for testing — jsdom lacks IndexedDB, crypto, and service worker APIs; use Vitest 4 Browser Mode

### Expected Features

Research against Pathbuilder 2e, D&D Beyond, and Foundry VTT PF2e reveals a clear MVP scope and a set of differentiators that would leapfrog every competitor simultaneously.

**Must have (table stakes) — v1 launch:**
- JSON import from both Pathbuilder and Foundry VTT — root dependency of everything; without it there is nothing to roll
- Click-to-roll: skills, saves, perception, initiative, attacks, damage, spells — users expect this from both competitors
- Pre-calculated modifiers with labeled breakdown (proficiency + ability + item + status) — differentiates from a bare d20 roller
- DC entry + degree of success display (4 levels: critical success / success / failure / critical failure) — the core PF2e-specific win; neither Pathbuilder nor D&D Beyond does this
- Natural 20 / natural 1 degree shift — correctness requirement; missing = wrong results
- Multiple Attack Penalty UI (1st/2nd/3rd, agile-aware) — biggest single gap in Pathbuilder; daily friction point for every martial character
- Hero point reroll button on failed d20 — beloved PF2e mechanic, low implementation cost, high delight
- Roll history (session-scoped, scrollable) — Pathbuilder has nothing; D&D Beyond has it; users expect it
- Free-form dice expression roller — expected baseline; feels broken without it
- PWA offline + installable — D&D Beyond, Pathbuilder, and Foundry all require internet; this is the table-use differentiator
- Responsive mobile layout with large tap targets — players roll at the table on their phones
- IndexedDB persistence — characters survive page reload

**Should have (competitive) — v1.x:**
- Status/circumstance/item bonus toggles per roll (manual overlay for situational bonuses)
- Check Prompt (GM-initiated roll request with shareable link or in-app notification)
- GM Mode (multi-character switcher for running multiple PCs or NPCs)
- Session export (JSON/CSV with session ID + timestamp for verified roll records)
- Foundry-style full check dialog (DC type, difficulty offset, success-step adjustment)
- Remaining two themes (only one theme needed at launch; polish after core UX validated)

**Defer (v2+):**
- Feat effect auto-parsing — high complexity, high maintenance; ship manual override first and validate demand
- Check Prompt sharing via URL — needs careful design to stay client-side-only
- Extended dice syntax (exploding dice, counted successes) — PF2e rarely needs these

### Architecture Approach

The architecture is a clean four-layer system with explicit boundaries: (1) an Import/Parse Layer that converts Foundry and Pathbuilder JSON into a single `NormalizedCharacter` TypeScript schema, (2) a pure-function Rules Engine (modifier resolver, MAP calculator, degree-of-success calculator, dice engine) with no React/Svelte dependencies, (3) a Svelte 5 runes state layer for reactive UI state, backed by (4) a Dexie persistence layer that writes asynchronously as fire-and-forget subscriptions. The `NormalizedCharacter` schema is the critical interface contract — it must be locked before the rules engine and UI are built, because both depend on its field names.

**Major components:**
1. **Import/Parse Layer** (`parsers/`) — Foundry and Pathbuilder parsers each output `NormalizedCharacter`; format detection is automatic; parsers are pure functions with no side effects
2. **Rules Engine** (`engine/`) — `dice.ts`, `modifiers.ts`, `map.ts`, `degreeOfSuccess.ts`, `checkPrompt.ts`; all pure functions; independently testable; the correctness guarantee of the product
3. **Svelte 5 State** (`store/`) — character state, roll history, session state (MAP, hero points), UI state (theme, active panel); runes-based reactivity; IDB writes are subscriptions, not blocking awaits
4. **Persistence Layer** (`persistence/`) — Dexie repos for characters, roll history, sessions, prefs; hydrates store on boot; update state first, write IDB async
5. **PWA Shell** — `@vite-pwa/sveltekit` + Workbox `generateSW`; `StaleWhileRevalidate` for app shell, `CacheFirst` for static assets
6. **Theme Layer** — Tailwind v4 `@theme` tokens scoped to `[data-theme]`; toggle via `document.documentElement.dataset.theme`; instant, no flash

**Key patterns:**
- **Adapter pattern for parsers**: Both formats write to `NormalizedCharacter`; the rest of the app never sees raw Foundry or Pathbuilder JSON
- **Pure engine functions**: Rules logic is testable without a browser or store setup
- **Fire-and-forget IDB writes**: Store is the truth; update UI immediately, persist in background
- **Check Prompt as async flow**: Modal returns a promise; roll hook awaits result before computing

### Critical Pitfalls

1. **Degree-of-success order of operations** — Apply nat-20/nat-1 step shift FIRST (before any feat-based shifts); compute numeric degree first, then nat modifier, then additional shifts. Test: high-modifier nat-1 vs DC 1 should still succeed; nat-20 with modifier already beating DC by 10 is still crit-success, not "double crit."

2. **Bonus type stacking — never add all modifiers naively** — Only the highest status bonus applies; only the highest circumstance bonus applies; only the highest item bonus applies; all untyped values stack. Store modifier lists with type tags, never raw totals. A raw-total model requires a full data refactor to fix later.

3. **Foundry JSON has no pre-computed skill or attack totals** — `system.skills` is empty `{}` in exports; attack bonuses require computing from proficiency rank + ability mod + level + potency rune. Pathbuilder pre-computes attack bonuses but skill values still need derivation. Test the sample files against expected values before building any UI.

4. **Critical hit damage for deadly/fatal weapons** — `(baseRoll × 2) + critBonusDice`. The deadly/fatal trait dice are added AFTER doubling, never included in the doubled expression. Fatal also replaces base die size before doubling. Hard-coding "double dice count" produces silently wrong results on every magic weapon.

5. **MAP derives from the current weapon's traits, not a global counter** — `MAP = attackNumber × (weapon.hasAgile ? -4 : -5)`. Switching weapons mid-round must re-derive the penalty from the weapon being swung. Compute fresh each time; never mutate a global counter.

6. **Pathbuilder spells are names only** — No damage expressions or attack bonuses in `spellCasters[].spells[].list`. For Pathbuilder imports, spell damage must use the free dice roller prompt, not an auto-roll. Document this clearly in the UI.

7. **Pathbuilder `mods` object must be parsed** — `build.mods` contains typed bonus modifiers (`"Item Bonus": 1`) keyed by skill/save name. Ignoring it means characters with magic gear roll without item bonuses. Parse and route through the typed modifier aggregator.

---

## Implications for Roadmap

The architecture's `Suggested Build Order` from ARCHITECTURE.md and the pitfall phase mappings from PITFALLS.md converge on the same dependency chain. Every suggested phase below respects those hard dependencies.

### Phase 1: Foundation and PWA Shell
**Rationale:** Everything downstream depends on the build system, state layer, and persistence schema being in place. Changing the IDB schema after data is stored requires migration logic. Set it up correctly first.
**Delivers:** SvelteKit + Tailwind v4 scaffold, `@vite-pwa/sveltekit` configured (Workbox `generateSW`), Dexie schema with versioned tables (characters, history, sessions, prefs), Svelte 5 store slices (all empty), CSS theme layer (3 themes as custom properties), GitHub Pages deployment pipeline (Actions + `.nojekyll`)
**Addresses:** PWA offline + installable (table stakes)
**Avoids:** Service worker stale cache pitfall (set up Workbox auto-manifest from day one); IndexedDB quota/iOS pitfall (wrap all IDB calls in try/catch from day one)
**Research flag:** Standard patterns — Workbox and SvelteKit adapter-static are well-documented; skip phase research

### Phase 2: Character Import Pipeline
**Rationale:** All character-derived rolls depend on imported character data. This is the root dependency of the entire feature tree. The `NormalizedCharacter` schema must be locked here because the rules engine and UI both consume it.
**Delivers:** `NormalizedCharacter` TypeScript schema (the interface contract), Foundry VTT JSON parser (verified against `Foundry-Knurvik.json` sample), Pathbuilder JSON parser (verified against `Pathbuilder-Kairos.json` sample), format autodetection, file import UI, `characterStore` integration, Dexie character persistence
**Addresses:** JSON import from both sources (table stakes P1)
**Avoids:** Foundry empty skills pitfall (derive from components, not stored totals); Pathbuilder `mods` pitfall (parse and route through typed modifier system); Pathbuilder spells-are-names pitfall (document data gap in UI); Foundry feat rule elements pitfall (screen for `key: "Strike"`, flag rest for manual override)
**Research flag:** May benefit from phase research to confirm `NormalizedCharacter` field coverage against sample files before locking schema

### Phase 3: Core Rules Engine
**Rationale:** Engine correctness is the product's core value proposition. Build and test it before any UI depends on it so failures are caught in unit tests, not during user interactions.
**Delivers:** `dice.ts` (expression parser + `crypto.getRandomValues` PRNG), `modifiers.ts` (typed bonus stacking — circumstance/status/item/untyped), `degreeOfSuccess.ts` (4-level outcome + nat-20/nat-1 step shift + additional shifts), `map.ts` (per-weapon agile-aware MAP derivation), `checkPrompt.ts` (DC resolution, difficulty offset, success-step adjustment)
**Addresses:** Degree of success (table stakes P1), modifier breakdown (table stakes P1), MAP UI (differentiator P1), natural 20/1 shift (table stakes P1)
**Avoids:** All five rules-correctness pitfalls (DoS order, bonus stacking, deadly/fatal crits, MAP weapon derivation) — these must all be addressed here with unit tests before UI work begins
**Research flag:** Standard patterns — rules are verified from Archives of Nethys (HIGH confidence); no additional research needed; write tests against the published rules

### Phase 4: Basic Roll UI (Skills, Saves, Perception)
**Rationale:** First end-to-end user-facing value. Uses the parsers and engine from Phases 2-3. Delivers the daily-driver rolls most players use every session.
**Delivers:** Character Panel (skills, saves, perception, initiative as click targets), `useRoll` hook (orchestrates import flow → modifier resolution → dice roll → result card → log append), `RollResult` component (modifier breakdown displayed), Roll Log (append-only, session-scoped), DC entry input + degree-of-success display, free-form dice roller
**Addresses:** Click-to-roll (table stakes P1), modifier breakdown (table stakes P1), DC + DoS (table stakes P1), roll history (table stakes P1), free-form roller (table stakes P1)
**Avoids:** Modifier breakdown always visible pitfall (never show just a total); MAP reset pitfall (persist state until "New Turn" tap)
**Research flag:** Standard patterns — skip phase research

### Phase 5: Attack and Damage Flow
**Rationale:** Combat rolls (attacks, damage) have the most complexity (MAP, critical hit variants, deadly/fatal traits) and are on the critical path for martial characters. Separate phase ensures this complexity gets dedicated attention and testing.
**Delivers:** Attack List from `NormalizedCharacter.attacks`, MAP-aware attack roll (1st/2nd/3rd toggle, agile-aware), damage roll (conditional on hit), critical hit handling (deadly/fatal formulas), weapon trait display
**Addresses:** Attack + damage (table stakes P1), MAP UI (differentiator P1), hero point reroll (differentiator P1)
**Avoids:** Deadly/fatal critical formula pitfall (double base, add trait dice after); MAP derives from current weapon pitfall (recompute per attack, never track a mutable counter)
**Research flag:** Standard patterns — weapon traits are well-documented in Archives of Nethys

### Phase 6: Spell Rolling
**Rationale:** Casters are a significant portion of the player base. Spells have their own rolling model (attack rolls vs saves, class DC, per-tradition modifiers). Defer until attack flow is solid.
**Delivers:** Spell List from `NormalizedCharacter.spellcasting`, spell attack rolls (attack modifier per tradition), spell save DC (class DC), damage display for Foundry-imported spells, free-roller prompt for Pathbuilder spell damage (data gap documented in UI)
**Addresses:** Spell click-to-roll (table stakes P1), caster support
**Avoids:** Pathbuilder spells-are-names pitfall (show free-roller prompt, not a crash or silent zero)
**Research flag:** Standard patterns — spell types (attack/save/utility) classifiable at import time from Foundry data

### Phase 7: Check Prompt and Hero Points
**Rationale:** The Foundry-style check prompt (DC type, difficulty offset, degree-shift) and hero point reroll are high-value differentiators that require the full rules engine to be in place. Natural phase after core rolling works.
**Delivers:** `CheckPrompt` modal (title, DC entry, difficulty adjustment, success-step adjustment), DC types (numeric, simple DC table, level-based), hero point reroll button on failed d20, hero point counter per character, fortune/misfortune interaction guard
**Addresses:** Check Prompt (differentiator P2), hero point reroll (differentiator P1), DC entry (table stakes P1)
**Avoids:** Fortune/misfortune cancel pitfall (disable hero point when fortune effect active); hero point on misfortune pitfall
**Research flag:** Standard patterns for the modal itself; fortune/misfortune interaction rules verified from Archives of Nethys

### Phase 8: Session Features and GM Mode
**Rationale:** Session tagging, export, and GM multi-character support are power-user features that extend the core roller. Builds on roll history already in place from Phase 4.
**Delivers:** Session tagging on roll history, export roll history to JSON/CSV (with session ID + character + timestamp), GM Roster (multi-character switching), character name prefix on all log entries in GM mode, player mode (single-character focus)
**Addresses:** Roll export (differentiator P2), GM Mode (differentiator P2), session-tagged history (differentiator P2)
**Avoids:** GM mode log readability pitfall (character name on every entry)
**Research flag:** Standard patterns — IndexedDB queries by session ID are straightforward with Dexie's index API

### Phase 9: Polish and Remaining Differentiators
**Rationale:** Refinement pass once core product is validated. Theme variants, responsive layout tuning, and the status bonus overlay are polish that add value but aren't blockers.
**Delivers:** All three theme variants refined, responsive layout verified (phone / tablet / desktop), status/circumstance/item bonus overlay per roll (manual toggles), feat manual override system (for rule elements not auto-parsed), arbitrary dice picker UI, PWA install prompt handling
**Addresses:** Three themes (differentiator P2), status bonus overlay (differentiator P2), feat override (partial P3)
**Avoids:** Theme result color coding pitfall (semantic theme-aware tokens, not hard-coded colors)
**Research flag:** Standard patterns — Tailwind v4 theming is well-documented

### Phase Ordering Rationale

- **Foundation before everything**: The IDB schema and Dexie setup must be versioned from day one. A schema change after data is in production requires migration logic — cost grows with each revision.
- **NormalizedCharacter schema before engine and UI**: Both consumers depend on field names and types. Locking the schema in Phase 2 means Phases 3 and 4 can proceed in parallel (rules engine and basic UI can both mock characters from the schema without waiting for each other to finish).
- **Rules engine before roll UI**: Catching correctness bugs in unit tests (Phase 3) is cheap. Catching them in integrated user flows (Phase 4+) means debugging through the entire stack.
- **Attack flow after basic rolls**: The MAP and critical damage complexity warrants a dedicated phase so it doesn't slow down getting the simpler daily-driver rolls (skills, saves) working first.
- **Session/GM features after core rolling is stable**: These are power-user features that add value on top of working rolls; they don't need to be part of the initial validation loop.

### Research Flags

Phases needing deeper research during planning:
- **Phase 2 (Character Import):** Consider a light phase-research pass to confirm `NormalizedCharacter` field coverage against both sample files before locking the schema. Schema changes cascade expensively — it is worth 30 minutes of pre-planning here.

Phases with standard patterns (skip research-phase):
- **Phase 1:** SvelteKit adapter-static, Workbox, GitHub Pages deployment are all well-documented with official guides.
- **Phase 3:** PF2e rules are officially documented on Archives of Nethys; no ambiguity in sources.
- **Phases 4-9:** All patterns follow directly from Phases 1-3 foundations; no unknown integrations.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All package versions verified on npm within days of research; official docs confirmed for all integrations; no speculative choices |
| Features | MEDIUM | Pathbuilder direct access was blocked; supplemented with patch notes and issue tracker — competitive analysis is solid but some Pathbuilder internals are inferred |
| Architecture | HIGH | PF2e rules verified against Archives of Nethys (official); JSON schemas verified against actual sample files in repo; PWA patterns verified against official Workbox/vite-plugin-pwa docs |
| Pitfalls | HIGH | Rules pitfalls verified from official PF2e source (Archives of Nethys); format pitfalls verified against actual sample JSON files (`Foundry-Knurvik.json`, `Pathbuilder-Kairos.json`) |

**Overall confidence:** HIGH

### Gaps to Address

- **Pathbuilder caster JSON coverage**: The sample file (`Pathbuilder-Kairos.json`) appears to be a non-caster character. The spell data gap (names only) is documented but the full shape of a caster's `spellCasters` array needs verification with a caster export. Validate during Phase 2 before locking the `NormalizedCharacter` schema for spellcasting.
- **Foundry abilities null in export**: The sample shows `system.abilities` as null. The derivation path for ability scores in Foundry exports needs a concrete resolution — either from `system.abilities`, from item data, or by prompting the user. Resolve during Phase 2.
- **Feat rule element parsing scope**: The project scopes feat auto-parsing as "manual override for unknowns" with only `key: "Strike"` being auto-parsed. The exact set of parseable rule element keys should be enumerated during Phase 2 so the manual override UI covers the right cases.
- **GitHub Pages base path**: When deploying to `/<repo-name>` (not a custom domain), `paths.base` in `svelte.config.js` must match the repo name exactly. Confirm the repo name and set this before first deployment.

---

## Sources

### Primary (HIGH confidence)
- [npmjs.com: svelte, @sveltejs/kit, vite, tailwindcss, dexie, @dice-roller/rpg-dice-roller, @vite-pwa/sveltekit, vitest] — confirmed package versions
- [Archives of Nethys](https://2e.aonprd.com/) — PF2e rules: degree of success, natural 20/1, MAP, deadly/fatal traits, bonus stacking, hero points
- [Foundry VTT PF2e Wiki — Rule Elements Quickstart](https://github.com/foundryvtt/pf2e/wiki/Quickstart-guide-for-rule-elements) — rule element schema
- [vite-plugin-pwa official docs](https://vite-pwa-org.netlify.app/) — Workbox generateSW, precache strategy
- [SvelteKit static adapter docs](https://svelte.dev/docs/kit/adapter-static) — GitHub Pages configuration
- [Tailwind CSS v4 blog](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first `@theme` directive
- [Vitest 4.0 release blog](https://vitest.dev/blog/vitest-4) — Browser Mode stable, Playwright integration
- `Foundry-Knurvik.json` and `Pathbuilder-Kairos.json` — sample files in repo, examined directly

### Secondary (MEDIUM confidence)
- [D&D Beyond: Game Log announcement](https://www.dndbeyond.com/posts/939-share-your-dice-results-with-the-brand-new-game) — competitor feature analysis
- [Pathbuilder 2e GitLab Issue #1676](https://gitlab.com/doctor.unspeakable/pathbuilder-2e/-/issues/1676) — roll log feature request (confirms gap)
- [Foundry PF2e GitHub Issues](https://github.com/foundryvtt/pf2e/issues) — GM check prompt resolution
- [dddice Pathbuilder integration docs](https://docs.dddice.com/docs/integrations/pathbuilder-2e/) — Pathbuilder feature confirmation
- Community sources: framework comparison, PWA patterns, IndexedDB wrapper comparison

### Tertiary (LOW confidence)
- [Pathmuncher source](https://github.com/MrPrimate/pathmuncher) — Pathbuilder→Foundry naming differences (validated against sample files)

---
*Research completed: 2026-03-14*
*Ready for roadmap: yes*
