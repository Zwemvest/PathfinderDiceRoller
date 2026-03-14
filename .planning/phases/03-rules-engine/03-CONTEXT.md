# Phase 3: Rules Engine - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure-function PF2e rules engine: modifier stacking (typed bonus resolution), degree of success calculator (with nat 20/1 shifts), MAP calculator (standard and agile), dice expression parser (using @dice-roller/rpg-dice-roller library), and the modifier data model that supports pre-roll toggles. No UI components in this phase — only logic and types consumed by Phases 4-7.

</domain>

<decisions>
## Implementation Decisions

### Degree of Success
- Strict RAW order of operations: compare roll total vs DC first to get base degree, THEN apply nat 20/nat 1 shift one step
- Edge case: nat 1 that beats DC by 10+ = crit success base → shifted to success (not failure)
- Edge case: nat 20 that misses DC by 10+ = crit failure base → shifted to failure (not success)
- Roll card shows the shift chain: "Failure → Success (nat 20)" — what it would have been and what it became
- Color coding follows Foundry VTT style: Gold = crit success, Green = success, Orange = failure, Red = crit failure

### Modifier Stacking
- Follow PF2e stacking rules: highest bonus per typed category (status, circumstance, item), all untyped bonuses/penalties stack
- When multiple bonuses of the same type are present, only the highest is kept — suppressed bonuses are NOT shown on the roll card (clean display, only kept bonuses visible)
- Penalties of the same type DO stack (all penalties apply)
- The modifier model must support pre-roll toggles: persistent bonus/penalty list that stays active between rolls
- Ship with preset common PF2e bonuses (flanking +2 circumstance, inspire courage +1 status, frightened -1/-2/-3 status, etc.) plus ability to add fully custom bonuses (user enters type, value, label)

### Dice Expression Parser
- Use `@dice-roller/rpg-dice-roller` library for parsing and rolling
- Support PF2e standard notation: NdX+M, NdX-M (covers 99% of PF2e use cases: 2d8+4, 1d20+15)
- Drop/keep and exotic notation NOT required for v1 — the library supports them but we only need basic PF2e dice
- Use `crypto.getRandomValues` for randomness (already verified working in Phase 1 Vitest browser tests)

### MAP Calculator
- Standard MAP: 0 / -5 / -10 for 1st / 2nd / 3rd+ attack
- Agile MAP: 0 / -4 / -8 for weapons with the agile trait
- MAP is a pure function: takes attack number (1/2/3+) and isAgile boolean, returns penalty
- MAP state (which attack number you're on) is UI concern (Phase 5), not engine concern

### Claude's Discretion
- Internal API design (function signatures, return types)
- How the dice library integrates with the modifier stacking system
- How the modifier toggle preset list is stored (hardcoded vs configurable)
- Unit test edge case selection
- Whether to expose MAP as part of the modifier system or as a separate calculator

</decisions>

<specifics>
## Specific Ideas

- The degree of success shift display ("Failure → Success (nat 20)") is a player delight moment — make it prominent, not subtle
- Preset bonus toggles should cover the most common table situations: flanking, inspire courage/heroism, frightened, sickened, clumsy — things that come up every session
- All engine functions must be pure (no side effects, no Svelte state, no IndexedDB) — they're consumed by UI layers in later phases

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/parsers/types.ts`: NormalizedCharacter schema with NormalizedSkill, NormalizedWeapon, NormalizedSaves, NormalizedAbilities — the engine reads these types
- `src/lib/parsers/foundry.ts`: `profBonusFoundry(rank, level)` helper — could be extracted to a shared utility
- `src/lib/db/index.ts`: Dexie database with `rollHistory` table (RollHistoryEntry: id, rolledAt, expression, result) — engine produces data that matches this shape
- Vitest unit project configured (`vitest.config.ts`) — pure function tests run in node, no browser needed

### Established Patterns
- Svelte 5 runes: `$state()`, `$derived()` for reactive state
- TypeScript strict mode
- TDD pattern established in Phase 2 (RED → GREEN → REFACTOR)
- Separate unit vs browser test projects in vitest

### Integration Points
- Phase 4 (Core Rolling) calls engine functions to compute roll results for skills/saves/perception
- Phase 5 (Attacks) calls MAP calculator + damage engine
- Phase 6 (Spells) calls spell attack/DC functions
- Phase 7 (Check Prompt) calls degree of success with configurable DC
- All phases use the modifier stacking system for pre-roll toggles

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-rules-engine*
*Context gathered: 2026-03-15*
