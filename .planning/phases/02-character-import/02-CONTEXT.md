# Phase 2: Character Import - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

NormalizedCharacter schema definition, Foundry VTT JSON parser, Pathbuilder JSON parser, import UI with file picker and drag-drop, character list/switcher, and character display on the Character tab. This phase takes raw JSON exports and produces a unified character model stored in IndexedDB. Rolling functionality is NOT in this phase — character data is displayed but not yet rollable.

</domain>

<decisions>
## Implementation Decisions

### Import Flow
- File picker button + drag-and-drop support (no paste)
- Import lives in Character tab empty state: big "Import Character" button when no character loaded
- After first import, a + button appears for additional imports
- User selects format before import: "Foundry" or "Pathbuilder" picker (no auto-detect)
- On success: confirmation card — "Imported Knurvik (Level 1 Monk)" — then shows character overview
- On failure: detailed error message showing what went wrong — "Found JSON but missing expected fields: system.details.level"

### Character Display
- Dashboard overview at top: name, class, level, key ability modifiers, HP
- Ability scores: **modifier only** (no raw scores) — PF2e Remaster made scores irrelevant, show "+4 STR" not "STR 18 (+4)"
- Collapsible sections below dashboard: Skills, Attacks, Spells, Saves, Feats
- Skills: compact 2-column grid — skill name + total modifier, tap to roll (rolling wired in Phase 4)
- Attacks/weapons: compact display — "+1 Striking Staff +15" — full damage breakdown appears on roll result (Phase 5)
- Spells: show spell names and levels grouped by spell level — no damage data (user uses free-form dice roller in Phase 6)
- Saves: Fortitude, Reflex, Will with total modifiers
- Feats: grouped by type (class feat, ancestry feat, skill feat, general feat) — names only, no mechanical effects until v2
- Perception: displayed prominently (used frequently for initiative and checks)

### Data Handling
- User selects format (Foundry vs Pathbuilder) before import — no auto-detection
- Multiple characters allowed — user can import several characters (for alts, not GM mode)
- Re-import: match by character name, show confirmation with changes summary ("Level 5 → 6, new feat: Sudden Charge"), confirm before replacing
- Both parsers produce the same NormalizedCharacter schema
- Dexie `characters` store expanded from Phase 1 placeholder to full NormalizedCharacter

### Character Switcher
- Separate character list page (not a dropdown) — shows all imported characters as cards
- Tap a character card to make it the active character and navigate to their dashboard
- Active character indicated visually
- Delete character available from the list (with confirmation)

### JSON Format Specifics
- **Foundry JSON** (5 sample files: Knurvik/Monk, Brickney Spears/Barbarian, Duin/Cleric, Roo/Thaumaturge, plus others): abilities is null, skills is {}, saves is {} — everything must be reconstructed from items[]. Parser needs heavy reconstruction work.
- **Pathbuilder JSON** (1 sample: Kairos/Magus): pre-computed totals (attack bonuses, proficiencies, ability scores with full breakdown, weapons with attack/damage/extraDamage). Much easier to parse.
- Both formats produce identical NormalizedCharacter output
- Spell data: Pathbuilder has spell names/levels/slots/prepared lists but NO damage expressions. Foundry may have spells in items[]. Either way, spell display is names + levels only — damage via free-form roller (Phase 6).

### Claude's Discretion
- NormalizedCharacter TypeScript interface design (field names, nesting structure)
- Parser implementation approach (how to reconstruct Foundry data from items[])
- Error handling granularity (which fields are required vs optional)
- Character card design on the list page
- Collapsible section default states (expanded/collapsed)
- How to handle Foundry spells found in items[] vs spellcasting entries

</decisions>

<specifics>
## Specific Ideas

- Character display should be information-dense but not cluttered — you're looking at this between combat rounds on your phone
- Ability modifier display: just "+4 STR" — the PF2e Remaster removed ability scores, only modifiers matter now
- Weapons should be compact: "+1 Striking Staff +15" — the full damage expression (2d8+4 B + 1d4 Fire) shows on the roll result card, not on the character sheet
- The character list is the "home" when no character is active — it's where you land after opening the app

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/db/index.ts`: Dexie database with `characters` table (placeholder interface: id, importedAt, name, raw). Needs expansion to full NormalizedCharacter.
- `src/lib/db/persistence.ts`: Storage persistence with `requestPersistentStorage()` — already handles iOS safety net.
- `src/lib/components/layout/TabBar.svelte`: Bottom tab navigation with Character/Roll/History tabs.
- `src/routes/character/+page.svelte`: Stub Character page ready for content.
- `src/test-stubs/`: Established pattern for mocking `$app/*` virtual modules in Vitest.

### Established Patterns
- Svelte 5 runes: `$state()`, `$derived()`, `$effect()` — NOT Svelte 4 `$:` syntax
- Tailwind CSS v4 with `@theme` tokens in `app.css`
- Vitest browser mode with Playwright for IndexedDB tests
- `$app/*` stubs via Vite resolve aliases for component tests

### Integration Points
- `src/lib/db/index.ts` Character interface → expand to NormalizedCharacter
- `src/routes/character/+page.svelte` → character display UI
- Phase 3 (Rules Engine) depends on NormalizedCharacter field names — schema is locked after this phase
- Phase 4 (Core Rolling) reads character skills/saves/perception from NormalizedCharacter
- Phase 5 (Attacks) reads weapons/attacks from NormalizedCharacter
- Phase 6 (Spells) reads spellcasting data from NormalizedCharacter

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-character-import*
*Context gathered: 2026-03-14*
