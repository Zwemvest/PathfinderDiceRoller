# Roadmap: Pathfinder 2e Dice Roller

## Overview

Seven phases build the dice roller from the ground up. Phase 1 establishes the PWA shell and platform so every subsequent phase has a working deployment target. Phase 2 locks the `NormalizedCharacter` schema and imports characters from both Foundry and Pathbuilder. Phase 3 implements the pure rules engine that gives every roll its correctness guarantee. Phase 4 delivers the first end-to-end user value: click-to-roll for skills, saves, and perception, with full roll history. Phase 5 adds the complex combat flow: attacks, MAP, damage, and hero point rerolls. Phase 6 brings spell rolling for casters. Phase 7 completes the product with the Foundry-style check prompt.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - SvelteKit + PWA shell, IndexedDB schema, GitHub Pages deployment pipeline (completed 2026-03-14)
- [x] **Phase 2: Character Import** - NormalizedCharacter schema, Foundry and Pathbuilder parsers, import UI (completed 2026-03-14)
- [x] **Phase 3: Rules Engine** - Modifier stacking, degree of success, MAP calculator, dice expression parser (completed 2026-03-15)
- [ ] **Phase 4: Core Rolling** - Click-to-roll skills/saves/perception/initiative, free-form dice, roll history
- [ ] **Phase 5: Attacks, Damage & Hero Points** - Attack rolls, MAP UI, critical damage, hero point rerolls
- [ ] **Phase 6: Spell Rolling** - Spell attacks, spell DCs, damage display, caster support
- [ ] **Phase 7: Check Prompt** - Foundry-style check dialog with DC types, difficulty adjustment, degree shift

## Phase Details

### Phase 1: Foundation
**Goal**: A deployable PWA shell exists that users can install and use offline
**Depends on**: Nothing (first phase)
**Requirements**: PLAT-01, PLAT-02, PLAT-03, PLAT-04, PLAT-05
**Success Criteria** (what must be TRUE):
  1. The app loads at the GitHub Pages URL and is installable from a browser on a phone
  2. After initial load, the app works completely offline (no network requests for core functionality)
  3. The app is usable on phone, tablet, and desktop without horizontal scrolling or broken layout
  4. Character data and settings written to IndexedDB survive a full page reload
  5. A fresh deploy from the main branch goes live on GitHub Pages without manual steps
**Plans:** 3/3 plans complete

Plans:
- [x] 01-01-PLAN.md — Scaffold SvelteKit project, install deps, configure build tooling + PWA + test infra
- [x] 01-02-PLAN.md — Dexie IndexedDB schema, app shell UI (tabs, dice tray, routes), browser tests
- [x] 01-03-PLAN.md — GitHub Actions CI/CD workflow, deployment verification checkpoint

### Phase 2: Character Import
**Goal**: Users can bring their characters into the app and those characters survive sessions
**Depends on**: Phase 1
**Requirements**: IMPT-01, IMPT-02, IMPT-03, IMPT-04, IMPT-05
**Success Criteria** (what must be TRUE):
  1. User can select a Foundry VTT JSON file and the app loads that character's name, class, level, skills, saves, attacks, and spells correctly
  2. User can select a Pathbuilder JSON file and the app loads that character with correct modifier totals (including item bonuses from the `mods` object)
  3. Imported character is still present after closing and reopening the browser
  4. User can delete a character and it is removed from storage
  5. User can re-import a newer JSON for an existing character and the updated data replaces the old
**Plans:** 3/3 plans complete

Plans:
- [ ] 02-01-PLAN.md — NormalizedCharacter types + Foundry and Pathbuilder parsers with TDD tests
- [ ] 02-02-PLAN.md — Dexie v2 migration, import UI flow, character list/switcher, delete and re-import
- [ ] 02-03-PLAN.md — Character display components (dashboard, skills, saves, attacks, spells, feats)

### Phase 3: Rules Engine
**Goal**: All PF2e rules logic is implemented as tested pure functions that guarantee correct roll results
**Depends on**: Phase 2
**Requirements**: DGRN-01, DGRN-02, DGRN-03, DGRN-04, DGRN-05, MODF-01, MODF-02, MODF-03, MODF-04, MODF-05
**Success Criteria** (what must be TRUE):
  1. Given a roll total and DC, the app displays the correct degree of success (critical success / success / failure / critical failure) including nat-20 and nat-1 step shifts applied in the correct order
  2. When multiple status bonuses are present, only the highest applies; circumstance and item bonuses follow the same rule; untyped modifiers all stack — and the modifier breakdown confirms which values were kept vs suppressed
  3. A roll result card shows a labeled breakdown of every component (proficiency, ability, status, item, circumstance, untyped) not just a total
  4. Degree of success results are visually distinct with color coding (e.g., gold for crit success, red for crit failure)
  5. The engine passes unit tests for the known edge cases: high-modifier nat-1 vs DC 1 succeeds; nat-20 that already beats by 10 is still crit success not "double crit"; agile MAP applies -4/-8 and standard MAP applies -5/-10
**Plans:** 2/2 plans complete

Plans:
- [ ] 03-01-PLAN.md — Engine types, degree of success calculator (TDD), modifier stacking system + presets (TDD)
- [ ] 03-02-PLAN.md — Dice expression roller (rpg-dice-roller wrapper), MAP calculator, barrel export

### Phase 4: Core Rolling
**Goal**: Users can click any skill, save, perception, or initiative entry and get a complete, logged roll result
**Depends on**: Phase 3
**Requirements**: ROLL-01, ROLL-02, ROLL-03, ROLL-04, ROLL-05, DICE-01, DICE-02, DICE-03, DICE-04, DICE-05, HIST-01, HIST-02, HIST-03, HIST-04
**Success Criteria** (what must be TRUE):
  1. Clicking any skill, saving throw (Fortitude, Reflex, Will), Perception, or Initiative produces a roll with the correct total modifier and an individual dice result visible
  2. Every roll appears in a scrollable log immediately, showing roll type, expression, individual dice, all modifiers, total, and degree of success (if a DC was set)
  3. User can type an arbitrary dice expression (e.g., `3d6+2`, `4d6kh3`, `2d8dh1`) and roll it, with the result appearing in the log
  4. Roll history persists after a page reload
  5. User can clear the roll history and the log empties
**Plans**: TBD

### Phase 5: Attacks, Damage & Hero Points
**Goal**: Martial characters can roll attacks with correct MAP and damage, and spend hero points to reroll failures
**Depends on**: Phase 4
**Requirements**: ATTK-01, ATTK-02, ATTK-03, ATTK-04, ATTK-05, ATTK-06, HERO-01, HERO-02, HERO-03, HERO-04
**Success Criteria** (what must be TRUE):
  1. Clicking an attack produces an attack roll with the correct modifier; a 1st/2nd/3rd attack selector applies the correct MAP (-5/-10 for standard, -4/-8 for agile), derived from the selected weapon's traits
  2. A damage roll is displayed alongside the attack roll (or on a confirmed hit), broken out by damage type, with critical hits correctly doubling dice before adding deadly/fatal trait dice
  3. Hero point count is shown per character; after a failed d20 roll, a reroll button appears and clicking it consumes one hero point and replaces the original result in the log
  4. Switching weapons mid-round correctly re-derives MAP from the new weapon's traits
**Plans**: TBD

### Phase 6: Spell Rolling
**Goal**: Caster characters can roll spell attacks and display spell DCs and damage from their imported character
**Depends on**: Phase 5
**Requirements**: SPEL-01, SPEL-02, SPEL-03
**Success Criteria** (what must be TRUE):
  1. Clicking a spell attack (from a Foundry-imported character) produces an attack roll with the correct spell attack modifier for that tradition
  2. For damage-dealing spells imported from Foundry, the damage expression is displayed and rolled
  3. For spells that require saving throws, the character's spell DC is shown alongside the spell entry
  4. For Pathbuilder-imported characters where spell damage is unavailable, the UI clearly indicates the data gap and offers the free-form dice roller instead of silently rolling zero
**Plans**: TBD

### Phase 7: Check Prompt
**Goal**: Anyone can create a structured check prompt that specifies a DC and rolling conditions, usable by both player and GM
**Depends on**: Phase 6
**Requirements**: CHKP-01, CHKP-02, CHKP-03, CHKP-04, CHKP-05, CHKP-06, CHKP-07
**Success Criteria** (what must be TRUE):
  1. User can open a check prompt dialog and set an optional title, then configure the DC as a flat number, a Simple DC by level (from the PF2e table), or a level-based DC
  2. User can apply a difficulty adjustment (incredibly easy through incredibly hard) that shifts the DC, and a success-step adjustment that shifts the final degree of success up or down
  3. From the check prompt, user can choose which skill or Perception to roll, and the roll fires with the correct modifier and the configured DC applied automatically
  4. The resulting roll card shows the degree of success with all prompt settings (DC type, difficulty offset, step adjustment) visible in the breakdown
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete   | 2026-03-14 |
| 2. Character Import | 3/3 | Complete   | 2026-03-14 |
| 3. Rules Engine | 2/2 | Complete   | 2026-03-15 |
| 4. Core Rolling | 0/TBD | Not started | - |
| 5. Attacks, Damage & Hero Points | 0/TBD | Not started | - |
| 6. Spell Rolling | 0/TBD | Not started | - |
| 7. Check Prompt | 0/TBD | Not started | - |
