---
phase: 02-character-import
plan: "02"
subsystem: database, ui
tags: [dexie, indexeddb, svelte5, runes, tailwind, import, characters]

requires:
  - phase: 02-01
    provides: NormalizedCharacter schema, parseFoundry, parsePathbuilder, ImportError

provides:
  - Dexie v2 schema storing NormalizedCharacter as StoredCharacter
  - CRUD helpers: saveCharacter, getCharacter, getAllCharacters, deleteCharacter, findCharacterByName
  - Active character tracking: getActiveCharacterId, setActiveCharacterId
  - FormatPicker component (Foundry/Pathbuilder radio pills, $bindable)
  - ImportZone component (file picker + drag-drop, state machine, re-import diff)
  - CharacterCard component (card with active indicator and delete button)
  - character/+page.svelte (import zone or dashboard based on active character)
  - characters/+page.svelte (grid of all characters, select/delete/import)

affects:
  - 03-character-sheet (reads StoredCharacter from db via getActiveCharacterId/getCharacter)
  - 04-roll-ui (needs activeCharacterId to apply modifiers)
  - 05-spellcasting (reads spellcasters from StoredCharacter)

tech-stack:
  added: []
  patterns:
    - "Dexie v2 versioned schema upgrade with clear() for breaking data changes"
    - "StoredCharacter = NormalizedCharacter + id? for IndexedDB row identity"
    - "Svelte 5 state machine: let state = $state<ImportState>({ kind: 'idle' }) with discriminated union"
    - "$effect() with browser guard for Dexie data loading on mount"
    - "findCharacterByName() for re-import name matching before save"

key-files:
  created:
    - src/lib/db/character.browser.test.ts
    - src/lib/components/import/FormatPicker.svelte
    - src/lib/components/import/ImportZone.svelte
    - src/lib/components/character/CharacterCard.svelte
    - src/routes/characters/+page.svelte
  modified:
    - src/lib/db/index.ts
    - src/routes/character/+page.svelte

key-decisions:
  - "StoredCharacter extends NormalizedCharacter with id?: number — Dexie auto-increments the id on insert"
  - "version(2).upgrade() clears characters table — Phase 1 data was raw JSON placeholder, incompatible with NormalizedCharacter shape"
  - "saveCharacter uses db.characters.put() which acts as upsert — insert if no id, update if id present"
  - "Re-import matching by name (exact case-sensitive) using findCharacterByName before save"
  - "Active character stored as key='activeCharacterId' in settings table (consistent with existing settings pattern)"

patterns-established:
  - "Discriminated union ImportState drives all UI states in ImportZone without boolean flags"
  - "Characters page uses $effect() + browser guard to avoid SSR/Dexie conflict"

requirements-completed: [IMPT-03, IMPT-04, IMPT-05]

duration: 5min
completed: "2026-03-14"
---

# Phase 2 Plan 02: Character Import UI and Persistence Summary

**Dexie v2 schema storing NormalizedCharacter plus complete import flow: format picker, file/drag-drop zone, success/error feedback, re-import diff, character list with active tracking and delete**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-14T22:19:07Z
- **Completed:** 2026-03-14T22:24:04Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Dexie schema migrated to v2 storing NormalizedCharacter; version(2).upgrade() clears Phase 1 placeholder data
- Full import flow: FormatPicker (Foundry/Pathbuilder) → file pick or drag-drop → parse → save → success card; re-import shows field-diff before replacing
- Character list page (/characters) with card grid, active indicator, delete confirmation, and embedded ImportZone
- 9 new browser CRUD tests pass; all 122 tests pass; production build succeeds (32 PWA precache entries)

## Task Commits

Each task was committed atomically:

1. **Task 1 RED: Failing browser tests** - `041f45a` (test)
2. **Task 1 GREEN: Dexie v2 schema + CRUD helpers** - `337ca26` (feat)
3. **Task 2: Import UI flow and character list page** - `1cf89fc` (feat)

## Files Created/Modified

- `src/lib/db/index.ts` — Dexie v2 schema: StoredCharacter, CRUD helpers, active character settings
- `src/lib/db/character.browser.test.ts` — 9 browser tests: CRUD, findByName, active tracking, persistence
- `src/lib/components/import/FormatPicker.svelte` — Foundry/Pathbuilder radio pill buttons with $bindable()
- `src/lib/components/import/ImportZone.svelte` — State machine import zone (idle/parsing/success/error/confirm-reimport)
- `src/lib/components/character/CharacterCard.svelte` — Character card with active border, delete button
- `src/routes/character/+page.svelte` — Shows ImportZone when empty, placeholder dashboard when loaded
- `src/routes/characters/+page.svelte` — Character list page: grid, select, delete, import another

## Decisions Made

- `StoredCharacter` extends `NormalizedCharacter` with `id?: number` — Dexie auto-increments the id on insert, making it the natural primary key
- `version(2).upgrade()` clears characters table — Phase 1 data was raw JSON strings incompatible with the new NormalizedCharacter shape
- `saveCharacter` uses `db.characters.put()` (upsert) — inserting without an id creates a new record; providing an id updates the existing row. This handles both initial import and re-import cleanly
- Re-import detection: `findCharacterByName()` exact match before save triggers the diff confirmation state
- Active character stored as `key='activeCharacterId'` in the settings table — consistent with Phase 1 settings pattern

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Full import pipeline complete: format selection → file read → parse → persist → list
- `StoredCharacter` interface locked with `id`; Phase 3 (character sheet) can `getCharacter(activeId)` directly
- Active character tracked; Phase 4 (roll UI) can read `getActiveCharacterId()` to apply modifiers
- The placeholder dashboard in character/+page.svelte (showing HP/AC/Perception) is ready to be replaced with full character sheet in Phase 3

---
*Phase: 02-character-import*
*Completed: 2026-03-14*
