---
phase: 03-rules-engine
plan: 02
subsystem: engine
tags: [typescript, dice-roller, rpg-dice-roller, pf2e, map, pure-functions, tdd]

# Dependency graph
requires:
  - phase: 03-rules-engine-plan-01
    provides: types.ts, degree.ts, DEGREE_COLORS — consumed by barrel re-export

provides:
  - rollExpression wrapper around @dice-roller/rpg-dice-roller with configurable RNG
  - configureEngine() for swapping browserCrypto (prod) vs nativeMath (tests)
  - computeMAP pure function for standard and agile MAP penalties
  - resolveModifiers PF2e typed bonus stacking function
  - PRESET_MODIFIERS readonly array of common PF2e condition toggles
  - src/lib/engine/index.ts barrel exporting all engine functions, types, constants

affects:
  - phase-04-roll-ui (imports computeDegree, resolveModifiers, rollExpression from '$lib/engine')
  - phase-05-attack-rolls (imports computeMAP from '$lib/engine')
  - phase-06-spells (imports rollExpression from '$lib/engine')
  - phase-07-advanced (imports full engine barrel)

# Tech tracking
tech-stack:
  added:
    - "@dice-roller/rpg-dice-roller ^5.5.1 — dice expression parsing and rolling"
  patterns:
    - "configureEngine() pattern — export engine configurator to allow test override without env checks"
    - "browserCrypto in production / nativeMath in unit tests — set in beforeAll via configureEngine"
    - "naturalDie from dieResults[0] — first die face extracted from roll.rolls nested structure for nat 20/1 detection"
    - "Typed bonus stacking: highest bonus per category wins, worst penalty per category wins, untyped all stack"

key-files:
  created:
    - src/lib/engine/dice.ts
    - src/lib/engine/dice.unit.test.ts
    - src/lib/engine/map.ts
    - src/lib/engine/map.unit.test.ts
    - src/lib/engine/modifiers.ts
    - src/lib/engine/modifiers.unit.test.ts
    - src/lib/engine/presets.ts
    - src/lib/engine/presets.unit.test.ts
    - src/lib/engine/index.ts
  modified:
    - src/lib/engine/degree.unit.test.ts (bug fix in test data)
    - package.json (added @dice-roller/rpg-dice-roller)

key-decisions:
  - "Export configureEngine() from dice.ts — lets test files override RNG engine without modifying production code or adding env checks"
  - "naturalDie = dieResults[0] — first die result is the d20 face for 1d20+M rolls; consistent with how rollExpression is used for checks"
  - "Plan 01 prerequisite files (modifiers.ts, presets.ts, their tests) created in this plan execution since engine dir was partially initialized"
  - "DiceRoll (not DiceRoller) — stateless rolling, no history log maintained"

patterns-established:
  - "Engine modules are pure functions with no side effects, no Svelte state, no IndexedDB access"
  - "Unit tests run in node project; beforeAll sets nativeMath engine to avoid window.crypto dependency"
  - "Barrel export via src/lib/engine/index.ts — single import point for all phase consumers"

requirements-completed: [DGRN-01, DGRN-02, MODF-04]

# Metrics
duration: 4min
completed: 2026-03-15
---

# Phase 3 Plan 02: Dice Roller + MAP Calculator Summary

**rollExpression wrapper around @dice-roller/rpg-dice-roller with browserCrypto RNG, computeMAP for standard/agile weapons, and barrel index.ts exposing the full PF2e engine from '$lib/engine'**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-15T01:09:47Z
- **Completed:** 2026-03-15T01:13:47Z
- **Tasks:** 2 (plus Plan 01 prerequisite files)
- **Files modified:** 11

## Accomplishments

- Installed @dice-roller/rpg-dice-roller and wired rollExpression with configureEngine for RNG swapping
- computeMAP returns correct MAP penalties for standard (-5/-10) and agile (-4/-8) weapons
- resolveModifiers enforces PF2e typed stacking rules with highest bonus / worst penalty per typed category
- PRESET_MODIFIERS ships 9 common PF2e condition toggles (all enabled=false)
- Barrel index.ts lets consumers do `import { computeDegree, resolveModifiers, rollExpression, computeMAP } from '$lib/engine'`
- Full test suite: 169 tests passing (47 engine unit tests + 122 browser/other)

## Task Commits

Each task was committed atomically:

1. **Task 1: Dice expression roller + MAP calculator (TDD)** - `ec871b3` (feat)
2. **Task 2: Barrel export + full suite verification** - `da35318` (feat)

## Files Created/Modified

- `src/lib/engine/dice.ts` — rollExpression + configureEngine + DiceRollResult interface
- `src/lib/engine/dice.unit.test.ts` — 10 unit tests for dice structure, ranges, nat die, invalid notation
- `src/lib/engine/map.ts` — computeMAP pure function
- `src/lib/engine/map.unit.test.ts` — 6 unit tests for standard and agile MAP
- `src/lib/engine/modifiers.ts` — resolveModifiers with PF2e typed stacking
- `src/lib/engine/modifiers.unit.test.ts` — 10 unit tests for bonus/penalty stacking rules
- `src/lib/engine/presets.ts` — PRESET_MODIFIERS readonly array (9 entries)
- `src/lib/engine/presets.unit.test.ts` — 7 unit tests for preset structure and uniqueness
- `src/lib/engine/index.ts` — barrel re-export of all engine modules
- `src/lib/engine/degree.unit.test.ts` — fixed incorrect test data (nat-1 boundary case)
- `package.json` + `package-lock.json` — added @dice-roller/rpg-dice-roller

## Decisions Made

- **configureEngine() pattern:** Exported function lets tests override the RNG engine without env-sniffing in production code. Production uses browserCrypto; unit tests set nativeMath in beforeAll.
- **naturalDie = dieResults[0]:** The first element is the d20 face for 1d20+M rolls. Phase 4/5 always call rollExpression with a d20 expression for checks, so index 0 is always the nat die.
- **Plan 01 prerequisites created inline:** modifiers.ts, presets.ts and their tests were missing (engine dir was partially initialized). Created as part of this plan execution under Rule 3 (blocking issue) — they are direct dependencies for the barrel export.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created missing Plan 01 engine prerequisite files**
- **Found during:** Task 1 setup (before RED phase)
- **Issue:** engine/ directory had only types.ts, degree.ts, degree.unit.test.ts — modifiers.ts, presets.ts and their tests were absent, making the barrel export incomplete
- **Fix:** Created modifiers.ts, modifiers.unit.test.ts, presets.ts, presets.unit.test.ts with full TDD (RED + GREEN)
- **Files modified:** src/lib/engine/modifiers.ts, src/lib/engine/modifiers.unit.test.ts, src/lib/engine/presets.ts, src/lib/engine/presets.unit.test.ts
- **Verification:** 17 new unit tests pass
- **Committed in:** ec871b3 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed incorrect test data in degree.unit.test.ts**
- **Found during:** Pre-task verification (running existing tests)
- **Issue:** `computeDegree(-5, 2, 1)` test expected baseDegree='critical-failure' but -5-2=-7 is only 'failure' (not crit-failure). Test comment said "fails by 10+" but the inputs don't satisfy that threshold.
- **Fix:** Changed inputs to `computeDegree(-5, 6, 1)` where diff=-11 → crit-failure base. Nat 1 shift has no effect at the minimum (shifted=false).
- **Files modified:** src/lib/engine/degree.unit.test.ts
- **Verification:** All 14 degree tests pass
- **Committed in:** ec871b3 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking prerequisite, 1 test bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations above.

## User Setup Required

None - no external service configuration required. @dice-roller/rpg-dice-roller is a standard npm package installed automatically.

## Next Phase Readiness

- Full engine API available from `$lib/engine` — Phases 4-7 can import without knowing internal structure
- rollExpression with naturalDie enables nat 20/1 shift in Phase 4 roll UI
- computeMAP ready for Phase 5 attack rolls
- resolveModifiers + PRESET_MODIFIERS ready for Phase 4 modifier toggles UI
- No blockers for Phase 4

---
*Phase: 03-rules-engine*
*Completed: 2026-03-15*
