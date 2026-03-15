# Phase 4: Core Rolling - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

First end-to-end rolling experience: tap a skill/save/perception/initiative on the character sheet, see a roll result with modifier breakdown, and find it in the roll history. Also: free-form dice expression tray and the full roll history tab. This phase wires the Phase 3 engine to the Phase 2 character display and Phase 1 app shell.

</domain>

<decisions>
## Implementation Decisions

### Roll Result Card
- Compact by default: roll label (e.g., "Athletics"), total (bold), DoS badge (if DC set)
- Tap to expand: shows full modifier breakdown (proficiency, ability, status, item, circumstance, untyped)
- Natural d20 result shown as a highlighted/bold number, total shown separately
- DoS displayed as inline colored badge next to total: [SUCCESS] in green, with shift note as subtitle ("Failure → Success (nat 20)")
- DoS colors: Gold = crit success, Green = success, Orange = failure, Red = crit failure (Foundry-style, from Phase 3)
- Only kept modifiers shown (suppressed bonuses hidden, per Phase 3 decision)

### Roll Interaction Flow
- Tapping a skill/save/perception opens a **pre-roll dialog** (not instant roll)
- Pre-roll dialog shows: roll label, base modifier, active modifier toggles (from Phase 3 presets + custom), DC entry field
- User can toggle modifiers on/off, enter DC, then confirm to roll
- Result appears in the persistent roll result card
- DC can also be entered/edited on the result card after rolling (post-roll DC entry)
- DC field also available in the dice tray area (pre-set before rolling, applies to next roll)

### Initiative
- "Roll Initiative" button opens pre-roll dialog
- Default: Perception (most common)
- Dropdown picker to select a different skill (e.g., Stealth for Avoid Notice, Performance for Fascinating Performance)
- Uses the same pre-roll dialog with modifier toggles

### Free-Form Dice Tray
- Text input field + "Roll" button — type "2d8+4", tap Roll
- Collapsed by default (small bar) — tap to expand the input field, saves vertical space on small screens
- No quick-pick dice buttons (keep it simple — text input covers all cases)
- Results appear in the same persistent roll result card
- Free-form rolls show in roll history alongside character rolls

### Roll History Tab
- Minimal list: one line per roll — "Athletics +15 = 23 [Success]"
- Tap a history entry to see full result card (same expanded view as the persistent card)
- Last 100 rolls kept in IndexedDB — auto-prune oldest when limit reached
- "Clear History" button at top of History tab with confirmation dialog
- History persists across browser sessions (IndexedDB)
- Rolls from all characters intermixed chronologically (character name shown in entry)

### Claude's Discretion
- Pre-roll dialog layout and animations
- How modifier toggles are displayed in the dialog (chips, switches, checkboxes)
- Dice tray collapse/expand animation
- History entry timestamp format
- How free-form roll labels appear vs character roll labels
- Whether to auto-scroll history to latest roll

</decisions>

<specifics>
## Specific Ideas

- The pre-roll dialog is the "power user" moment — toggle flanking, enter DC, then roll. It should be fast: 2-3 taps to get from skill tap to result
- The dice tray collapsed state should be subtle — just a small "🎲" icon or thin bar at the bottom. Don't waste vertical space on phones
- Roll history should feel like a chat log — newest at bottom, scrolls up for older rolls
- The natural d20 number being highlighted is a table delight — everyone wants to see if they rolled a 20

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/engine/index.ts`: Barrel export — `rollExpression`, `computeDegree`, `resolveModifiers`, `PRESET_MODIFIERS`, `computeMAP`, `configureEngine`, and all types
- `src/lib/engine/degree.ts`: `computeDegree(total, dc, naturalDie)` returns `DegreeResult` with `degree`, `shifted`, `shiftedFrom`
- `src/lib/engine/modifiers.ts`: `resolveModifiers(modifiers[])` returns `ResolvedModifiers` with `total`, `kept[]`, `suppressed[]`
- `src/lib/engine/presets.ts`: `PRESET_MODIFIERS` — 9 toggle-able preset conditions
- `src/lib/engine/dice.ts`: `rollExpression(expr)` returns `DiceRollResult` with `total`, `expression`, `naturalDie`, `rolls[]`
- `src/lib/components/character/SkillsSection.svelte`: 2-column skill grid — needs click handlers added
- `src/lib/components/character/SavesSection.svelte`: Fort/Ref/Will display — needs click handlers
- `src/lib/components/character/CharacterDashboard.svelte`: Shows perception — needs click handler
- `src/lib/components/layout/DiceTray.svelte`: Currently an HTML comment placeholder — needs full rebuild
- `src/lib/components/layout/RollResultCard.svelte`: Currently an HTML comment placeholder — needs full rebuild
- `src/lib/db/index.ts`: `rollHistory` table with `RollHistoryEntry` (id, rolledAt, expression, result) — needs expansion for full roll data
- `src/routes/history/+page.svelte`: Stub history page — needs full implementation

### Established Patterns
- Svelte 5 runes: `$state()`, `$derived()`, `$effect()`
- Tailwind CSS v4 with `@theme` tokens
- Vitest browser mode for component tests, unit mode for pure functions
- `$app/*` stubs in `src/test-stubs/` for Vitest
- Global `cursor: pointer` on all buttons (app.css)

### Integration Points
- SkillsSection/SavesSection/CharacterDashboard → add onclick → open pre-roll dialog → call engine → display in RollResultCard
- DiceTray → text input → call `rollExpression()` → display in RollResultCard
- RollResultCard → display `DiceRollResult` + `DegreeResult` + `ResolvedModifiers`
- Roll history → save `RollHistoryEntry` to Dexie on every roll → display in History tab
- `PRESET_MODIFIERS` → feed pre-roll dialog toggle list

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-core-rolling*
*Context gathered: 2026-03-15*
