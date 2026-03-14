---
phase: 02-character-import
plan: "01"
subsystem: parsers
tags: [tdd, parsers, types, schema, foundry, pathbuilder]
dependency_graph:
  requires: []
  provides: [NormalizedCharacter, parseFoundry, parsePathbuilder]
  affects: [02-02, 02-03, 03-rules-engine, 04-roll-ui, 05-attack-rolls, 06-spells]
tech_stack:
  added: []
  patterns: [TDD-red-green, pure-function-parsers, ability-reconstruction]
key_files:
  created:
    - src/lib/parsers/types.ts
    - src/lib/parsers/foundry.ts
    - src/lib/parsers/pathbuilder.ts
    - src/lib/parsers/foundry.unit.test.ts
    - src/lib/parsers/pathbuilder.unit.test.ts
  modified: []
decisions:
  - "NormalizedCharacter stores ability modifiers (not scores) — PF2e Remaster makes scores irrelevant for display"
  - "proficiencyRank stored in Foundry 0-4 scale in both parsers — downstream phases use one formula: rank === 0 ? 0 : level + rank*2"
  - "Pathbuilder name field may include postfix text beyond the character name — test relaxed to startsWith match"
  - "Foundry parser reconstructs ability scores from boost chain (ancestry -> background -> class -> level) then converts to mods"
metrics:
  duration: "9 minutes"
  completed: "2026-03-14T22:16:21Z"
  tasks_completed: 3
  files_created: 5
  files_modified: 0
  tests_written: 102
  tests_passing: 102
---

# Phase 2 Plan 1: Character JSON Parsers Summary

**One-liner:** NormalizedCharacter schema locked with two pure-function parsers — Foundry reconstructs ability scores from boost chain, Pathbuilder reads pre-computed values — both normalizing to identical output shape verified by 102 TDD tests.

## What Was Built

### types.ts
Defines the locked `NormalizedCharacter` interface and all supporting types consumed by Phases 3-7:
- Type aliases: `AbilitySlug`, `DamageType`, `MagicTradition`, `SpellcastingType`, `FeatCategory`
- Interfaces: `NormalizedAbilities`, `NormalizedSaves`, `NormalizedSkill`, `NormalizedWeapon`, `NormalizedSpell`, `NormalizedSpellcaster`, `NormalizedFeat`, `NormalizedCharacter`
- `ImportError` class with `missingField` property
- `requireField<T>()` helper for safe dot-path access with descriptive errors
- `SKILL_ABILITY_MAP`, `ALL_SKILLS`, `SKILL_LABELS` constants

### foundry.ts — `parseFoundry(json: unknown): NormalizedCharacter`
Handles the complex Foundry VTT export format where ability scores must be reconstructed:
1. Walks ancestry boosts/flaws, background boosts, class key ability boost, level boosts from `system.build.attributes.boosts`
2. Computes saves/perception using `profBonus = rank === 0 ? 0 : level + rank*2` (Foundry 0-4 rank scale)
3. Merges `system.skills` with class trained skills for skill proficiency
4. Parses weapon proficiency from class attacks object; handles finesse trait (DEX vs STR)
5. Builds spellcasting from `spellcastingEntry` items linked to `spell` items by `_id`

### pathbuilder.ts — `parsePathbuilder(json: unknown): NormalizedCharacter`
Handles Pathbuilder's pre-computed format (simpler but different rank encoding):
1. Reads ability scores directly from `build.abilities`, converts to modifiers
2. Proficiency bonus formula: `rank === 0 ? 0 : level + rank` (Pathbuilder 0/2/4/6/8 scale)
3. Rank stored normalized to 0-4 Foundry scale (divide by 2) for consistent downstream use
4. Item bonuses pulled from `build.mods[TitleCaseName]["Item Bonus"]`
5. Lore skills parsed from `build.lores` tuples with INT governing ability
6. Weapons use pre-computed `attack` field; striking rune string mapped to extra dice count

## Test Coverage

| Suite | File | Tests |
|-------|------|-------|
| Foundry parser | foundry.unit.test.ts | 60 |
| Pathbuilder parser | pathbuilder.unit.test.ts | 42 |
| **Total** | | **102** |

Tests verify: all 4 Foundry sample characters (Knurvik Monk, Brickney Barbarian, Duin Cleric, Roo Thaumaturge), Kairos Magus L6 (abilities, saves, perception, skills with item bonuses, weapons, spells, feats, HP), and error cases (null input, missing fields, wrong type, `success: false`).

## Decisions Made

1. **Ability modifiers, not scores:** `NormalizedAbilities` stores modifiers directly. PF2e Remaster deprecated ability scores for display — all downstream phases work with modifiers only.

2. **Unified proficiency rank scale (0-4):** Both parsers normalize `proficiencyRank` to the Foundry 0-4 scale. Foundry stores 0-4 natively; Pathbuilder stores 0/2/4/6/8 which is divided by 2. Downstream phases use one formula.

3. **Pathbuilder name contains postfix:** The actual `build.name` from Pathbuilder may append weapon/ability information (e.g. "Kairos (twisting tree, ha 2)"). Test relaxed to `startsWith` match; the full name is preserved in `NormalizedCharacter.name` as-is.

4. **`requireField()` helper for safe access:** Rather than ad-hoc null checks, all parsers use a shared `requireField<T>(obj, 'dot.path')` that throws `ImportError` with the field path in both `.message` and `.missingField` properties.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Missing `beforeAll` import in foundry test file**
- **Found during:** Task 2 (GREEN run)
- **Issue:** `foundry.unit.test.ts` used `beforeAll` without importing it from vitest
- **Fix:** Added `beforeAll` to the import from `vitest`
- **Files modified:** `src/lib/parsers/foundry.unit.test.ts`
- **Commit:** 00d56b7

**2. [Rule 1 - Bug] Pathbuilder name test expectation too strict**
- **Found during:** Task 3 (GREEN run)
- **Issue:** Actual `build.name` is "Kairos (twisting tree, ha 2)" not plain "Kairos"
- **Fix:** Changed test from `toBe('Kairos')` to `toMatch(/^Kairos/)` to reflect actual data
- **Files modified:** `src/lib/parsers/pathbuilder.unit.test.ts`
- **Commit:** 19d76da

## Self-Check: PASSED

All created files verified on disk. All task commits verified in git history.

| File | Status |
|------|--------|
| src/lib/parsers/types.ts | FOUND |
| src/lib/parsers/foundry.ts | FOUND |
| src/lib/parsers/pathbuilder.ts | FOUND |
| src/lib/parsers/foundry.unit.test.ts | FOUND |
| src/lib/parsers/pathbuilder.unit.test.ts | FOUND |
| .planning/phases/02-character-import/02-01-SUMMARY.md | FOUND |

| Commit | Hash |
|--------|------|
| RED: test(02-01) | 227c730 |
| GREEN: feat(02-01) Foundry | 00d56b7 |
| GREEN: feat(02-01) Pathbuilder | 19d76da |
