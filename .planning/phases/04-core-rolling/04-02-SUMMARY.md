---
phase: 04-core-rolling
plan: 02
subsystem: rolling-ui
tags: [svelte5, browser-tests, vitest, tdd, rolling, dialogs, tailwind]

# Dependency graph
requires:
  - phase: 04-core-rolling
    plan: 01
    provides: rollState, dialogState, openPreRollDialog, closePreRollDialog, setLastRoll, saveRoll, RollSnapshot
  - phase: 03-rules-engine
    provides: rollExpression, computeDegree, resolveModifiers, PRESET_MODIFIERS, DEGREE_COLORS
  - phase: 02-character-import
    provides: NormalizedSkill, NormalizedSaves, NormalizedCharacter types
provides:
  - PreRollDialog: modal dialog with modifier chips, DC input, initiative skill picker, Roll handler
  - RollResultCard: compact/expanded roll result display with DoS badge and modifier breakdown
  - DiceTray: collapsible free-form dice input with direct roll and dialog opener
  - Click handlers on all character display components (skills, saves, perception, initiative)
affects:
  - 05-history (HistoryEntry can now display RollSnapshot data from fully populated saves)
  - 04-03 (roll page placeholder; now has real rolling UI available)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Native <dialog> element with showModal()/close() synced via $effect watching $state.open"
    - "TDD browser tests: write test files (RED), commit, implement components (GREEN), commit"
    - "Thin layout wrapper pattern: layout/Component.svelte imports and re-exports rolling/Component.svelte"
    - "PreRollDialog mounted once at +layout.svelte level — available from all routes via dialogState singleton"
    - "optimizeDeps.include for @dice-roller/rpg-dice-roller prevents Vitest mid-test Vite reloads"

key-files:
  created:
    - src/lib/components/rolling/PreRollDialog.svelte
    - src/lib/components/rolling/PreRollDialog.browser.test.ts
    - src/lib/components/rolling/RollResultCard.svelte
    - src/lib/components/rolling/RollResultCard.browser.test.ts
    - src/lib/components/rolling/DiceTray.svelte
    - src/lib/components/rolling/DiceTray.browser.test.ts
  modified:
    - src/lib/components/layout/RollResultCard.svelte
    - src/lib/components/layout/DiceTray.svelte
    - src/routes/+layout.svelte
    - src/lib/components/character/SkillsSection.svelte
    - src/lib/components/character/SavesSection.svelte
    - src/lib/components/character/CharacterDashboard.svelte
    - src/routes/character/+page.svelte
    - vitest.config.ts

key-decisions:
  - "onclick|stopPropagation is Svelte 4 syntax — Svelte 5 requires onclick={(e) => e.stopPropagation()} inline handler"
  - "Added @dice-roller/rpg-dice-roller to vitest optimizeDeps.include to prevent mid-test Vite reloads (Rule 2 - missing critical config)"
  - "Free-form rolls skip computeDegree — notation comes directly from user input, not 1d20+M; dc/degree/shifted all null"
  - "Initiative skill picker self-loads from availableSkills prop instead of fetching from DB — simpler, CharacterDashboard passes character.skills"

# Metrics
duration: 6min
completed: 2026-03-15
---

# Phase 4 Plan 02: Rolling UI Summary

**PreRollDialog + RollResultCard + DiceTray components with TDD browser tests, all character click handlers wired to openPreRollDialog — full tap-to-roll UX complete**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-03-15T01:17:19Z
- **Completed:** 2026-03-15T01:22:40Z
- **Tasks:** 2 (Task 1 TDD: 3 commits; Task 2: 1 commit)
- **Files modified:** 14

## Accomplishments

- PreRollDialog: native `<dialog>` with `showModal()` / `close()` via `$effect`, 9 PRESET_MODIFIERS as toggleable chip buttons, DC entry, initiative skill picker, full roll handler (resolveModifiers → rollExpression → computeDegree → saveRoll → setLastRoll → closePreRollDialog)
- RollResultCard: compact view (label, total, nat d20, DoS badge with DEGREE_COLORS) and expanded view (modifier breakdown by type, die results, notation, post-roll DC what-if)
- DiceTray: collapsible bar with "Free Roll" label, text input for expressions (3d6+2, 4d6kh3, etc.), direct roll + modal opener path
- All 12 browser tests green across 3 test files (5 PreRollDialog + 4 RollResultCard + 3 DiceTray)
- All 186 total tests pass; `npm run build` succeeds
- Layout wrappers (layout/DiceTray, layout/RollResultCard) delegate to rolling/ counterparts
- PreRollDialog mounted once at +layout.svelte level — accessible from any route
- SkillsSection: every skill row is a `<button>` with openPreRollDialog
- SavesSection: every save card is a `<button>` with openPreRollDialog
- CharacterDashboard: Perception badge clickable + "Roll Initiative" button added

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing browser tests** - `7a74e66` (test)
2. **Task 1 GREEN: PreRollDialog, RollResultCard, DiceTray components** - `5ab651f` (feat)
3. **Task 2: Layout wiring and character click handlers** - `f58ce2c` (feat)

_Note: TDD task 1 produced RED + GREEN commits. No refactor commit needed._

## Files Created/Modified

**Created:**
- `src/lib/components/rolling/PreRollDialog.svelte` — modal with chips, DC, initiative picker, roll handler (103 lines)
- `src/lib/components/rolling/PreRollDialog.browser.test.ts` — 5 tests
- `src/lib/components/rolling/RollResultCard.svelte` — compact/expanded result display (175 lines)
- `src/lib/components/rolling/RollResultCard.browser.test.ts` — 4 tests
- `src/lib/components/rolling/DiceTray.svelte` — collapsible free-form dice input (88 lines)
- `src/lib/components/rolling/DiceTray.browser.test.ts` — 3 tests

**Modified:**
- `src/lib/components/layout/RollResultCard.svelte` — thin wrapper importing rolling/RollResultCard
- `src/lib/components/layout/DiceTray.svelte` — thin wrapper importing rolling/DiceTray
- `src/routes/+layout.svelte` — added PreRollDialog import and mount
- `src/lib/components/character/SkillsSection.svelte` — added characterName prop, skill row click handlers
- `src/lib/components/character/SavesSection.svelte` — added characterName prop, save card click handlers
- `src/lib/components/character/CharacterDashboard.svelte` — Perception clickable, Roll Initiative button
- `src/routes/character/+page.svelte` — passes characterName to SkillsSection and SavesSection
- `vitest.config.ts` — added @dice-roller/rpg-dice-roller to optimizeDeps.include

## Decisions Made

- `onclick|stopPropagation` is Svelte 4 event modifier syntax — replaced with `onclick={(e) => e.stopPropagation()}` for Svelte 5 compatibility
- Added `@dice-roller/rpg-dice-roller` to `optimizeDeps.include` in vitest.config.ts — prevents mid-test Vite reloads that cause test flakiness (same pattern as dexie from Phase 01-02)
- Free-form rolls skip `computeDegree` — expressions like `3d6+2` have no d20 natural value for nat 20/1 shift detection
- Initiative skill picker uses `availableSkills` prop passed from CharacterDashboard instead of self-fetching from DB — simpler, no async in component mount

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Svelte 4 event modifier syntax in RollResultCard**
- **Found during:** Task 1 GREEN - first test run
- **Issue:** `onclick|stopPropagation` compiled with error in Svelte 5 (`attribute_invalid_name`)
- **Fix:** Changed to `onclick={(e) => e.stopPropagation()}` inline handler
- **Files modified:** `src/lib/components/rolling/RollResultCard.svelte`
- **Commit:** `5ab651f`

**2. [Rule 2 - Missing Critical Config] Added @dice-roller to vitest optimizeDeps**
- **Found during:** Task 1 GREEN - test warning about mid-test reload
- **Issue:** Vitest reloaded mid-test when @dice-roller/rpg-dice-roller was first encountered, risking flaky tests
- **Fix:** Added to `optimizeDeps.include` in vitest.config.ts (same pattern as dexie)
- **Files modified:** `vitest.config.ts`
- **Commit:** `5ab651f`

## Self-Check: PASSED

All files present and all task commits verified:
- `src/lib/components/rolling/PreRollDialog.svelte` — FOUND
- `src/lib/components/rolling/RollResultCard.svelte` — FOUND
- `src/lib/components/rolling/DiceTray.svelte` — FOUND
- Commit `7a74e66` (RED tests) — FOUND
- Commit `5ab651f` (GREEN components) — FOUND
- Commit `f58ce2c` (layout wiring) — FOUND

---
*Phase: 04-core-rolling*
*Completed: 2026-03-15*
