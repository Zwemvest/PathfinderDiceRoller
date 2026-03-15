---
phase: 04-core-rolling
plan: 01
subsystem: database
tags: [dexie, indexeddb, svelte5, runes, roll-history, typescript]

# Dependency graph
requires:
  - phase: 03-rules-engine
    provides: DegreeOfSuccess type, DiceRollResult shape used in RollSnapshot fields
  - phase: 02-character-import
    provides: StoredCharacter in db/index.ts that shares the Dexie db instance
provides:
  - RollSnapshot interface (all fields for roll display and history)
  - Dexie v3 schema migration with rollHistory: RollSnapshot table
  - saveRoll / getRollHistory / clearRollHistory persistence helpers
  - rollState and dialogState module-level Svelte 5 $state singletons
  - openPreRollDialog / closePreRollDialog / setLastRoll action functions
affects:
  - 04-02 (pre-roll dialog component — imports dialogState, openPreRollDialog)
  - 04-03 (roll result display — imports rollState, setLastRoll)
  - 05-history (history panel — imports getRollHistory, clearRollHistory)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module-level $state in .svelte.ts files for cross-component reactive singletons"
    - "Dexie auto-prune: count >= MAX, get oldest N primary keys via orderBy().limit().primaryKeys(), then bulkDelete()"
    - "RollSnapshot keptModifiers stored as JSON string (not indexed) — structured clone serialisation"

key-files:
  created:
    - src/lib/db/roll-helpers.ts
    - src/lib/db/roll.browser.test.ts
    - src/lib/state/roll.svelte.ts
  modified:
    - src/lib/db/index.ts

key-decisions:
  - "RollHistoryEntry kept @deprecated for backwards compatibility — existing db.browser.test.ts references it"
  - "version(3) upgrade callback omitted — old entries with missing fields render gracefully with nullish checks"
  - "keptModifiers stored as JSON string in DB — allows complex nested object without requiring Dexie index"
  - "rollState and dialogState mutate properties directly, never reassign — Svelte 5 $state proxy rules"

patterns-established:
  - "Module-level Svelte 5 rune state: export const x = $state<T>({}) in .svelte.ts files"
  - "DB helper files live in src/lib/db/ alongside index.ts, not in separate services layer"

requirements-completed: [HIST-01, HIST-02, HIST-03, HIST-04]

# Metrics
duration: 6min
completed: 2026-03-15
---

# Phase 4 Plan 01: Roll Data Layer Summary

**RollSnapshot Dexie v3 schema with auto-pruning persistence helpers and Svelte 5 cross-component roll/dialog state singletons**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-15T01:12:06Z
- **Completed:** 2026-03-15T01:18:00Z
- **Tasks:** 2 (Task 1 TDD: 3 commits; Task 2: 1 commit)
- **Files modified:** 4

## Accomplishments

- RollSnapshot interface with 15 fields covers all data needed for roll display, history, and breakdown
- Dexie migrated to v3 with rollHistory typed as Table<RollSnapshot>; all 5 browser persistence tests green
- saveRoll auto-prunes to 100 entries (oldest-first bulkDelete before insert), getRollHistory returns newest-first, clearRollHistory empties table
- roll.svelte.ts provides module-level rollState and dialogState with openPreRollDialog / closePreRollDialog / setLastRoll — imported once, reactive everywhere

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing browser tests** - `ba22cb8` (test)
2. **Task 1 GREEN: RollSnapshot type + v3 migration + roll-helpers** - `7a6c737` (feat)
3. **Task 2: Module-level roll state singleton** - `01b46f7` (feat)

_Note: TDD task 1 produced RED + GREEN commits. No refactor commit needed._

## Files Created/Modified

- `src/lib/db/index.ts` - Added RollSnapshot interface, deprecated RollHistoryEntry, updated rollHistory table type, added version(3) migration block
- `src/lib/db/roll-helpers.ts` - saveRoll (auto-prune at 100), getRollHistory (newest-first), clearRollHistory
- `src/lib/db/roll.browser.test.ts` - 5 browser tests: persist+fields, auto-prune, clear, ordering, close/open cycle
- `src/lib/state/roll.svelte.ts` - rollState, dialogState, openPreRollDialog, closePreRollDialog, setLastRoll

## Decisions Made

- Kept `RollHistoryEntry` as `@deprecated` (not removed) — `db.browser.test.ts` from Phase 1 still imports it
- No `upgrade()` callback on version(3) — old entries with missing fields are acceptable; they'll render gracefully or be cleared
- `keptModifiers` stored as a JSON string — allows rich nested modifier breakdown without needing a Dexie index on complex data
- Direct property mutations on `$state` objects — Svelte 5 proxy rules forbid whole-object reassignment

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 04-02 (pre-roll dialog) and 04-03 (result display) imports are ready:
  - `import { dialogState, openPreRollDialog, closePreRollDialog } from '$lib/state/roll.svelte'`
  - `import { rollState, setLastRoll } from '$lib/state/roll.svelte'`
  - `import { saveRoll, getRollHistory, clearRollHistory } from '$lib/db/roll-helpers'`
  - `import type { RollSnapshot } from '$lib/db'`
- No blockers.

## Self-Check: PASSED

All files present. All task commits verified in git log.

---
*Phase: 04-core-rolling*
*Completed: 2026-03-15*
