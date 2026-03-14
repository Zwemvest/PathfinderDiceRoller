# Requirements: Pathfinder 2e Dice Roller

**Defined:** 2026-03-14
**Core Value:** Players and GMs can import their PF2e characters and roll any check with one tap, with correct modifiers applied automatically

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Character Import

- [x] **IMPT-01**: User can import a character from a Foundry VTT JSON export file
- [x] **IMPT-02**: User can import a character from a Pathbuilder JSON export file
- [ ] **IMPT-03**: Imported character data persists across browser sessions (IndexedDB)
- [ ] **IMPT-04**: User can delete an imported character
- [ ] **IMPT-05**: User can re-import/update a character from a new JSON export

### Skills & Saves

- [ ] **ROLL-01**: User can click a skill to roll with correct modifier (proficiency + ability + level + item + other)
- [ ] **ROLL-02**: User can click a saving throw (Fortitude, Reflex, Will) to roll with correct modifier
- [ ] **ROLL-03**: User can click Perception to roll with correct modifier
- [ ] **ROLL-04**: User can roll Initiative (using Perception or a selected skill)
- [ ] **ROLL-05**: Roll result card shows labeled modifier breakdown (proficiency, ability, status, item, circumstance)

### Attacks & Damage

- [ ] **ATTK-01**: User can click an attack to roll attack with correct modifier
- [ ] **ATTK-02**: Attack roll displays damage roll alongside (or on confirmed hit)
- [ ] **ATTK-03**: User can select which attack in the round (1st/2nd/3rd) for Multiple Attack Penalty
- [ ] **ATTK-04**: MAP correctly applies -5/-10 for standard weapons and -4/-8 for agile weapons
- [ ] **ATTK-05**: Damage displays by damage type (slashing, fire, etc.)
- [ ] **ATTK-06**: Critical hits correctly double damage dice (with deadly/fatal trait handling)

### Spells

- [ ] **SPEL-01**: User can click a spell to roll spell attack with correct modifier
- [ ] **SPEL-02**: Spell damage is always displayed for damage-dealing spells
- [ ] **SPEL-03**: Spell DC is displayed for spells that require saving throws

### Degree of Success

- [ ] **DGRN-01**: User can enter a DC for any d20 roll
- [ ] **DGRN-02**: App auto-computes degree of success (critical success / success / failure / critical failure) from roll total vs DC
- [ ] **DGRN-03**: Natural 20 shifts degree of success one step better
- [ ] **DGRN-04**: Natural 1 shifts degree of success one step worse
- [ ] **DGRN-05**: Degree of success is visually distinct (color-coded result)

### Check Prompt

- [ ] **CHKP-01**: User can create a check prompt with an optional title
- [ ] **CHKP-02**: Check prompt supports setting a flat DC number
- [ ] **CHKP-03**: Check prompt supports Simple DC (by level from PF2e table)
- [ ] **CHKP-04**: Check prompt supports Level-based DC
- [ ] **CHKP-05**: Check prompt supports difficulty adjustment (incredibly easy to incredibly hard)
- [ ] **CHKP-06**: Check prompt supports success step adjustment (shift degree up/down)
- [ ] **CHKP-07**: Check prompt allows choosing which skill or Perception to roll

### Modifiers & Bonuses

- [ ] **MODF-01**: User can add status bonuses/penalties to a roll
- [ ] **MODF-02**: User can add circumstance bonuses/penalties to a roll
- [ ] **MODF-03**: User can add item bonuses/penalties to a roll
- [ ] **MODF-04**: Bonus stacking follows PF2e rules (highest of each type, all untyped stack)
- [ ] **MODF-05**: User can add untyped penalties to a roll

### Hero Points

- [ ] **HERO-01**: User can track their hero point count (per character)
- [ ] **HERO-02**: On a d20 roll that results in failure, user can click to reroll with a hero point
- [ ] **HERO-03**: Hero point reroll consumes one hero point
- [ ] **HERO-04**: Reroll result replaces original in the roll history

### Free-Form Dice

- [ ] **DICE-01**: User can type arbitrary dice expressions (3d6+2, 2d8dh, 4d6kh3)
- [ ] **DICE-02**: Dice syntax supports drop highest/lowest (dh, dl)
- [ ] **DICE-03**: Dice syntax supports keep highest/lowest (kh, kl)
- [ ] **DICE-04**: User can add typed bonuses/penalties to free-form rolls
- [ ] **DICE-05**: Free-form rolls appear in roll history

### Roll History

- [ ] **HIST-01**: All rolls are recorded in a scrollable audit log
- [ ] **HIST-02**: Each roll entry shows: roll type, dice expression, individual dice results, modifiers, total, degree of success (if DC set)
- [ ] **HIST-03**: Roll history persists across browser sessions (IndexedDB)
- [ ] **HIST-04**: User can clear roll history

### Platform

- [x] **PLAT-01**: App is hosted on GitHub Pages as a static site
- [x] **PLAT-02**: App is installable as a PWA (manifest + service worker)
- [x] **PLAT-03**: App works offline after initial load
- [x] **PLAT-04**: App is responsive — usable on phone, tablet, and desktop
- [x] **PLAT-05**: All data stored client-side in IndexedDB (no server)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### GM Mode

- **GMMD-01**: GM can load and switch between multiple character/NPC sheets
- **GMMD-02**: Each character has independent roll history
- **GMMD-03**: GM can send check prompts to specific characters

### Advanced History

- **AHST-01**: Roll history is searchable (by roll type, character, result)
- **AHST-02**: Rolls are tagged by session with timestamps
- **AHST-03**: Roll history is exportable as JSON or CSV
- **AHST-04**: Exported history is GM-verifiable (includes all modifier details)

### Themes

- **THEM-01**: User can switch between three UI themes
- **THEM-02**: Parchment/fantasy theme (warm tones, texture)
- **THEM-03**: Pathfinder brand theme (red/gold/dark)
- **THEM-04**: Sleek modern theme (clean, minimal)

### Feat Integration

- **FEAT-01**: App parses feat effects from character JSON where possible
- **FEAT-02**: Auto-apply feat mechanical effects to relevant rolls
- **FEAT-03**: Flag feats that can't be auto-parsed for manual override
- **FEAT-04**: User can define custom mechanical effects for flagged feats

## Out of Scope

| Feature | Reason |
|---------|--------|
| 3D animated dice | Cosmetic complexity with zero rules value; competitors delegate to extensions |
| Real-time multiplayer / shared rolling | Requires server/backend; violates client-side-only constraint |
| Character sheet editing | Scope explosion; this is a roller, not a character builder |
| User accounts / cloud sync | Requires server infrastructure; violates GitHub Pages constraint |
| Automated condition tracking | Becomes a combat tracker; status bonus toggles cover the use case |
| Full combat tracker / initiative order | VTT territory; Foundry does this better |
| Homebrew rules support | Infinite scope; PF2e RAW only; free-form roller handles edge cases |
| Built-in feat/spell database | Maintenance burden tracking Paizo releases; licensing concerns |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 1 | Complete |
| PLAT-02 | Phase 1 | Complete |
| PLAT-03 | Phase 1 | Complete |
| PLAT-04 | Phase 1 | Complete |
| PLAT-05 | Phase 1 | Complete |
| IMPT-01 | Phase 2 | Complete |
| IMPT-02 | Phase 2 | Complete |
| IMPT-03 | Phase 2 | Pending |
| IMPT-04 | Phase 2 | Pending |
| IMPT-05 | Phase 2 | Pending |
| DGRN-01 | Phase 3 | Pending |
| DGRN-02 | Phase 3 | Pending |
| DGRN-03 | Phase 3 | Pending |
| DGRN-04 | Phase 3 | Pending |
| DGRN-05 | Phase 3 | Pending |
| MODF-01 | Phase 3 | Pending |
| MODF-02 | Phase 3 | Pending |
| MODF-03 | Phase 3 | Pending |
| MODF-04 | Phase 3 | Pending |
| MODF-05 | Phase 3 | Pending |
| ROLL-01 | Phase 4 | Pending |
| ROLL-02 | Phase 4 | Pending |
| ROLL-03 | Phase 4 | Pending |
| ROLL-04 | Phase 4 | Pending |
| ROLL-05 | Phase 4 | Pending |
| DICE-01 | Phase 4 | Pending |
| DICE-02 | Phase 4 | Pending |
| DICE-03 | Phase 4 | Pending |
| DICE-04 | Phase 4 | Pending |
| DICE-05 | Phase 4 | Pending |
| HIST-01 | Phase 4 | Pending |
| HIST-02 | Phase 4 | Pending |
| HIST-03 | Phase 4 | Pending |
| HIST-04 | Phase 4 | Pending |
| ATTK-01 | Phase 5 | Pending |
| ATTK-02 | Phase 5 | Pending |
| ATTK-03 | Phase 5 | Pending |
| ATTK-04 | Phase 5 | Pending |
| ATTK-05 | Phase 5 | Pending |
| ATTK-06 | Phase 5 | Pending |
| HERO-01 | Phase 5 | Pending |
| HERO-02 | Phase 5 | Pending |
| HERO-03 | Phase 5 | Pending |
| HERO-04 | Phase 5 | Pending |
| SPEL-01 | Phase 6 | Pending |
| SPEL-02 | Phase 6 | Pending |
| SPEL-03 | Phase 6 | Pending |
| CHKP-01 | Phase 7 | Pending |
| CHKP-02 | Phase 7 | Pending |
| CHKP-03 | Phase 7 | Pending |
| CHKP-04 | Phase 7 | Pending |
| CHKP-05 | Phase 7 | Pending |
| CHKP-06 | Phase 7 | Pending |
| CHKP-07 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 54 total
- Mapped to phases: 54
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-14*
*Last updated: 2026-03-14 after roadmap creation*
