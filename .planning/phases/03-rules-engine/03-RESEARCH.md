# Phase 3: Rules Engine - Research

**Researched:** 2026-03-15
**Domain:** PF2e rules logic — degree of success, modifier stacking, MAP, dice rolling
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Degree of Success**
- Strict RAW order of operations: compare roll total vs DC first to get base degree, THEN apply nat 20/nat 1 shift one step
- Edge case: nat 1 that beats DC by 10+ = crit success base → shifted to success (not failure)
- Edge case: nat 20 that misses DC by 10+ = crit failure base → shifted to failure (not success)
- Roll card shows the shift chain: "Failure → Success (nat 20)" — what it would have been and what it became
- Color coding follows Foundry VTT style: Gold = crit success, Green = success, Orange = failure, Red = crit failure

**Modifier Stacking**
- Follow PF2e stacking rules: highest bonus per typed category (status, circumstance, item), all untyped bonuses/penalties stack
- When multiple bonuses of the same type are present, only the highest is kept — suppressed bonuses are NOT shown on the roll card (clean display, only kept bonuses visible)
- Penalties of the same type DO stack (all penalties apply)
- The modifier model must support pre-roll toggles: persistent bonus/penalty list that stays active between rolls
- Ship with preset common PF2e bonuses (flanking +2 circumstance, inspire courage +1 status, frightened -1/-2/-3 status, etc.) plus ability to add fully custom bonuses (user enters type, value, label)

**Dice Expression Parser**
- Use `@dice-roller/rpg-dice-roller` library for parsing and rolling
- Support PF2e standard notation: NdX+M, NdX-M (covers 99% of PF2e use cases: 2d8+4, 1d20+15)
- Drop/keep and exotic notation NOT required for v1 — the library supports them but we only need basic PF2e dice
- Use `crypto.getRandomValues` for randomness (already verified working in Phase 1 Vitest browser tests)

**MAP Calculator**
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DGRN-01 | User can enter a DC for any d20 roll | DC is a pure input to `computeDegree(total, dc, dieValue)`; no side effects |
| DGRN-02 | App auto-computes degree of success (critical success / success / failure / critical failure) from roll total vs DC | PF2e RAW algorithm confirmed: compare total vs DC first, then apply nat shift |
| DGRN-03 | Natural 20 shifts degree of success one step better | Shift applied after base degree; confirmed with AoN rule text |
| DGRN-04 | Natural 1 shifts degree of success one step worse | Same shift mechanism; nat 1 detected via `initialValue === 1` on RollResult |
| DGRN-05 | Degree of success is visually distinct (color-coded result) | Foundry colors locked: Gold/Green/Orange/Red — map DegreeOfSuccess enum to CSS class/token |
| MODF-01 | User can add status bonuses/penalties to a roll | ModifierEntry type with `type: 'status'`; stacking resolved by `resolveModifiers()` |
| MODF-02 | User can add circumstance bonuses/penalties to a roll | ModifierEntry type with `type: 'circumstance'`; same resolution |
| MODF-03 | User can add item bonuses/penalties to a roll | ModifierEntry type with `type: 'item'`; same resolution |
| MODF-04 | Bonus stacking follows PF2e rules (highest of each type, all untyped stack) | PF2e RAW confirmed: highest typed bonus wins; all untyped stack; typed penalties also take worst |
| MODF-05 | User can add untyped penalties to a roll | ModifierEntry type with `type: 'untyped'`; all stack unconditionally |
</phase_requirements>

---

## Summary

Phase 3 implements the complete PF2e rules engine as pure TypeScript functions with no side effects. The three core subsystems are: (1) a degree-of-success calculator that applies RAW order-of-operations, (2) a modifier stacking system that enforces typed bonus caps and untyped stacking, and (3) a dice expression evaluator wrapping `@dice-roller/rpg-dice-roller` with `browserCrypto` engine. All functions are consumed by Phases 4–7; none touch Svelte state or IndexedDB.

The PF2e rules are unambiguous and fully confirmed via Archives of Nethys (the official SRD). Degree of success: compare roll total vs DC first to get base degree; then if die showed 1 or 20, shift one step. This means a nat 1 with modifier high enough to beat DC by 10+ yields a base of crit-success which shifts to success — NOT failure. The library's `RollResult.initialValue` property is the mechanism for detecting the raw die value before any modifiers are applied.

Modifier stacking is equally clear: for each typed category (status, circumstance, item) keep only the highest bonus and worst penalty independently; untyped modifiers all stack. The pre-roll toggle system stores a list of `ModifierEntry` objects; `resolveModifiers()` collapses them into a net total and breakdown, and the result is a `ResolvedModifiers` value that carries only the kept entries.

**Primary recommendation:** Build three separate pure-function modules — `engine/degree.ts`, `engine/modifiers.ts`, `engine/dice.ts` — plus a shared `engine/types.ts` for the data model. A barrel `engine/index.ts` re-exports everything for consumers in Phases 4–7. All unit tests go in `*.unit.test.ts` files and run in the node project.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dice-roller/rpg-dice-roller | ^5.5.1 | Dice expression parsing and rolling | Purpose-built library; handles all notation edge cases; has browserCrypto built in |
| TypeScript (already in project) | ^5.0.0 | Type-safe pure functions | Already in project; strict mode enforced |
| Vitest unit project (already configured) | ^4.0.0 | Pure-function unit tests in node env | Already configured in vitest.config.ts as `unit` project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| random-js (transitive via rpg-dice-roller) | — | Powers the NumberGenerator engines | Accessed via `NumberGenerator.engines.browserCrypto`; no direct import needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dice-roller/rpg-dice-roller | Hand-rolled dice parser | The library handles notation edge cases, result grouping, and RNG abstraction; not worth re-implementing |
| @dice-roller/rpg-dice-roller | dice-roller-parser (3d-dice) | rpg-dice-roller has better TypeScript types and active maintenance |
| browserCrypto engine | Math.random() | crypto.getRandomValues is decided; browserCrypto is the built-in engine for exactly this |

**Installation:**
```bash
npm install @dice-roller/rpg-dice-roller
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/lib/engine/
├── types.ts          # ModifierEntry, ResolvedModifiers, DegreeOfSuccess, RollResult, DiceRollResult
├── degree.ts         # computeDegree(total, dc, dieValue) → DegreeResult
├── modifiers.ts      # resolveModifiers(entries) → ResolvedModifiers
├── dice.ts           # rollExpression(notation) → DiceRollResult
├── map.ts            # computeMAP(attackNumber, isAgile) → number
├── presets.ts        # PRESET_MODIFIERS: readonly ModifierEntry[] (flanking, inspire courage, etc.)
└── index.ts          # barrel re-export
src/lib/engine/
└── *.unit.test.ts    # co-located unit tests
```

### Pattern 1: Degree of Success (RAW Algorithm)

**What:** Pure function that encodes the exact PF2e order of operations: base degree from total vs DC, then nat-shift.
**When to use:** Every d20 check that has a DC.

```typescript
// Source: Archives of Nethys — https://2e.aonprd.com/Rules.aspx?ID=2286
// and https://2e.aonprd.com/Rules.aspx?ID=2287

export type DegreeOfSuccess = 'critical-success' | 'success' | 'failure' | 'critical-failure';

export interface DegreeResult {
  degree: DegreeOfSuccess;
  baseDegree: DegreeOfSuccess;      // what numbers alone gave
  shifted: boolean;                  // was a nat-20/nat-1 shift applied?
  shiftDirection: 'up' | 'down' | 'none';
  // e.g. "Failure → Success (nat 20)"
}

function baseDegreeFromNumbers(total: number, dc: number): DegreeOfSuccess {
  const diff = total - dc;
  if (diff >= 10) return 'critical-success';
  if (diff >= 0)  return 'success';
  if (diff >= -9) return 'failure';
  return 'critical-failure';
}

function shiftUp(d: DegreeOfSuccess): DegreeOfSuccess {
  if (d === 'critical-failure') return 'failure';
  if (d === 'failure')          return 'success';
  if (d === 'success')          return 'critical-success';
  return 'critical-success'; // already crit-success, no higher
}

function shiftDown(d: DegreeOfSuccess): DegreeOfSuccess {
  if (d === 'critical-success') return 'success';
  if (d === 'success')          return 'failure';
  if (d === 'failure')          return 'critical-failure';
  return 'critical-failure'; // already crit-failure, no lower
}

export function computeDegree(
  total: number,
  dc: number,
  dieValue: number   // raw die face: 1–20
): DegreeResult {
  const baseDegree = baseDegreeFromNumbers(total, dc);
  let degree = baseDegree;
  let shifted = false;
  let shiftDirection: DegreeResult['shiftDirection'] = 'none';

  if (dieValue === 20) {
    degree = shiftUp(baseDegree);
    shifted = degree !== baseDegree;
    shiftDirection = shifted ? 'up' : 'none';
  } else if (dieValue === 1) {
    degree = shiftDown(baseDegree);
    shifted = degree !== baseDegree;
    shiftDirection = shifted ? 'down' : 'none';
  }

  return { degree, baseDegree, shifted, shiftDirection };
}
```

Note: when nat 20 already gives crit-success by numbers, `shiftUp` returns `'critical-success'` again — `shifted` will be `false`, which is correct RAW (no double-crit). Same logic applies to nat 1 when already at crit-failure.

### Pattern 2: Modifier Stacking

**What:** Collapses a flat list of `ModifierEntry` objects into a net modifier using PF2e stacking rules.
**When to use:** Before every roll to compute the total modifier and the breakdown.

```typescript
// Source: PF2e RAW — https://2e.aonprd.com/Rules.aspx?ID=22
export type ModifierType = 'status' | 'circumstance' | 'item' | 'untyped';

export interface ModifierEntry {
  id: string;         // unique stable id for toggle state
  label: string;      // display name, e.g. "Flanking"
  type: ModifierType;
  value: number;      // positive = bonus, negative = penalty
  enabled: boolean;   // pre-roll toggle state
}

export interface KeptModifier {
  entry: ModifierEntry;
  suppressed: false;
}

export interface ResolvedModifiers {
  total: number;                  // net modifier to add to d20 roll
  kept: ModifierEntry[];          // only entries that contribute (suppressed hidden per decision)
  breakdown: {
    status: number;
    circumstance: number;
    item: number;
    untyped: number;
  };
}

export function resolveModifiers(entries: ModifierEntry[]): ResolvedModifiers {
  const active = entries.filter(e => e.enabled);
  const typedBonusTypes: ModifierType[] = ['status', 'circumstance', 'item'];
  const kept: ModifierEntry[] = [];

  // For each typed category: keep highest bonus, keep worst (lowest) penalty
  for (const type of typedBonusTypes) {
    const ofType = active.filter(e => e.type === type);
    const bonuses = ofType.filter(e => e.value > 0);
    const penalties = ofType.filter(e => e.value < 0);

    if (bonuses.length > 0) {
      const best = bonuses.reduce((a, b) => a.value >= b.value ? a : b);
      kept.push(best);
    }
    if (penalties.length > 0) {
      const worst = penalties.reduce((a, b) => a.value <= b.value ? a : b);
      kept.push(worst);
    }
  }

  // Untyped: all stack unconditionally
  const untyped = active.filter(e => e.type === 'untyped');
  kept.push(...untyped);

  const total = kept.reduce((sum, e) => sum + e.value, 0);
  const breakdown = {
    status:       kept.filter(e => e.type === 'status').reduce((s, e) => s + e.value, 0),
    circumstance: kept.filter(e => e.type === 'circumstance').reduce((s, e) => s + e.value, 0),
    item:         kept.filter(e => e.type === 'item').reduce((s, e) => s + e.value, 0),
    untyped:      kept.filter(e => e.type === 'untyped').reduce((s, e) => s + e.value, 0),
  };

  return { total, kept, breakdown };
}
```

**IMPORTANT on penalties:** PF2e says typed penalties also take only the worst (not all). The code above handles this: for status penalties, only the lowest (worst) is kept. Untyped penalties always all stack.

### Pattern 3: Dice Rolling with browserCrypto

**What:** Thin wrapper around `@dice-roller/rpg-dice-roller` that configures the crypto engine and returns a structured result including the raw d20 face value (needed for nat 20/nat 1 detection).

```typescript
// Source: https://dice-roller.github.io/documentation/guide/customisation.html
import { DiceRoll, NumberGenerator } from '@dice-roller/rpg-dice-roller';

// Set once at module init (global to the library instance)
NumberGenerator.generator.engine = NumberGenerator.engines.browserCrypto;

export interface DiceRollResult {
  notation: string;       // e.g. "1d20+15"
  total: number;          // final total after all modifiers
  dieResults: number[];   // individual die face values (before arithmetic)
  naturalDie: number;     // for d20 rolls: the raw face value (1–20) for nat shift detection
  output: string;         // human-readable string e.g. "[17]+15 = 32"
}

export function rollExpression(notation: string): DiceRollResult {
  const roll = new DiceRoll(notation);

  // Extract individual die values from the RollResults in roll.rolls
  // roll.rolls is Array<ResultGroup | RollResults | string | number>
  // RollResults has .rolls which is Array<RollResult> with .initialValue (raw face)
  const dieResults: number[] = [];
  for (const group of roll.rolls) {
    if (group && typeof group === 'object' && 'rolls' in group) {
      const rollResults = (group as { rolls: Array<{ initialValue: number }> }).rolls;
      for (const r of rollResults) {
        dieResults.push(r.initialValue);
      }
    }
  }

  // For a 1d20+M roll, naturalDie is the single d20 face value
  const naturalDie = dieResults.length > 0 ? dieResults[0] : 0;

  return {
    notation: roll.notation,
    total: roll.total,
    dieResults,
    naturalDie,
    output: roll.output,
  };
}
```

**Caution:** `NumberGenerator.generator.engine = ...` is a global mutation. Set it once in the module scope so all DiceRoll instances use it. In unit tests (node env), `browserCrypto` may not be available — use `nativeMath` in test environments and the crypto engine in browser/production. Use an environment check or a test helper that sets the engine before each test suite.

### Pattern 4: MAP Calculator

**What:** Simple lookup pure function.

```typescript
// Source: PF2e CRB — Multiple Attack Penalty
export function computeMAP(attackNumber: 1 | 2 | 3, isAgile: boolean): number {
  if (attackNumber === 1) return 0;
  if (isAgile) return attackNumber === 2 ? -4 : -8;
  return attackNumber === 2 ? -5 : -10;
}
```

### Pattern 5: Preset Modifiers

**What:** Hardcoded readonly array of common PF2e pre-roll toggles. Stored in `presets.ts`, not in IndexedDB. UI phases use this as the starting list and add user-created custom entries on top.

```typescript
// Source: PF2e CRB conditions + common table situations
export const PRESET_MODIFIERS: Readonly<ModifierEntry[]> = [
  { id: 'flanking',         label: 'Flanking',           type: 'circumstance', value: +2,  enabled: false },
  { id: 'inspire-courage',  label: 'Inspire Courage',    type: 'status',       value: +1,  enabled: false },
  { id: 'inspire-heroism',  label: 'Inspire Heroism',    type: 'status',       value: +2,  enabled: false },
  { id: 'frightened-1',     label: 'Frightened 1',       type: 'status',       value: -1,  enabled: false },
  { id: 'frightened-2',     label: 'Frightened 2',       type: 'status',       value: -2,  enabled: false },
  { id: 'frightened-3',     label: 'Frightened 3',       type: 'status',       value: -3,  enabled: false },
  { id: 'sickened-1',       label: 'Sickened 1',         type: 'status',       value: -1,  enabled: false },
  { id: 'clumsy-1',         label: 'Clumsy 1',           type: 'status',       value: -1,  enabled: false },
  { id: 'clumsy-2',         label: 'Clumsy 2',           type: 'status',       value: -2,  enabled: false },
];
```

Mutual exclusivity of frightened conditions (can't have frightened 1 and 2 simultaneously) is a UI concern; the engine accepts whatever is enabled.

### Anti-Patterns to Avoid

- **Shifting nat 20/nat 1 BEFORE comparing to DC:** The RAW order is compare total vs DC first, then shift. Implementing shift-first yields wrong results for edge cases.
- **Double-shifting:** A nat 20 that already beats DC by 10+ is still only crit-success (not "double crit"). The shift is a max-1-step clamp, not additive.
- **Including suppressed bonuses in breakdown:** Per the locked decision, suppressed bonuses must not appear in the roll card display.
- **Treating typed penalties like bonuses (take highest):** PF2e says typed penalties also take the worst (lowest, i.e. most negative), not the "highest penalty" which would incorrectly mean least punishing.
- **Mutating ModifierEntry.enabled inside the engine:** The engine is pure; it reads `enabled`, never writes it. Toggle state lives in Svelte `$state()` in the UI layer.
- **Using `DiceRoller` (log-keeping) instead of `DiceRoll`:** For stateless pure rolling, `new DiceRoll(notation)` is sufficient and creates no history.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dice expression parsing | Custom NdX+M regex parser | @dice-roller/rpg-dice-roller | Handles operator precedence, chained expressions, drop/keep syntax for future use |
| Cryptographic RNG | Direct `crypto.getRandomValues` calls | `NumberGenerator.engines.browserCrypto` | Already integrated; handles distribution correctly using random-js |
| Dice notation validation | Custom validator | `DiceRoll` constructor throws on invalid notation | Library throws a descriptive error; catch and surface to user |

**Key insight:** The PF2e rules engine itself (degree of success, modifier stacking, MAP) MUST be hand-coded because no open-source library correctly implements PF2e 2nd Edition Remaster RAW. The dice rolling layer is the only piece that benefits from a library.

---

## Common Pitfalls

### Pitfall 1: Wrong Order of Operations for Degree of Success
**What goes wrong:** Developer implements nat 20 shift before comparing total vs DC. Result: a nat 20 that numerically gives a critical failure (total 10 or more below DC) becomes a failure instead of staying a failure.
**Why it happens:** Intuition says "nat 20 = good result" before any math.
**How to avoid:** Always compute `baseDegreeFromNumbers(total, dc)` first; only then apply the nat shift.
**Warning signs:** Test case "nat 20 total 5 vs DC 20" yields "success" instead of "failure."

### Pitfall 2: browserCrypto Unavailable in Node Test Environment
**What goes wrong:** Unit tests (node project) crash because `crypto.getRandomValues` is not available in Node < 19, or the test env doesn't expose the Web Crypto API.
**Why it happens:** `NumberGenerator.engines.browserCrypto` uses `window.crypto`; node env doesn't have `window`.
**How to avoid:** In test files, set `NumberGenerator.generator.engine = NumberGenerator.engines.nativeMath` before rolling. Add a `beforeAll` or export a `setTestEngine()` helper from `dice.ts`.
**Warning signs:** `ReferenceError: crypto is not defined` in unit test output.

### Pitfall 3: Typed Penalties — Taking "Best" Instead of "Worst"
**What goes wrong:** Implementation filters typed penalties to `max(value)` (least negative) instead of `min(value)` (most negative), so a frightened 3 (-3) gets overridden by frightened 1 (-1).
**Why it happens:** Code treats bonuses and penalties symmetrically (always take highest).
**How to avoid:** Separate positive values (bonuses) from negative values (penalties) in each typed category. Bonuses: take max. Penalties: take min (most negative).
**Warning signs:** Test "frightened 1 + frightened 3 = -1" when expected is -3.

### Pitfall 4: Modifier Totals Include Suppressed Entries
**What goes wrong:** `resolveModifiers` includes suppressed entries in the `total`, causing the displayed modifier to differ from the actual roll modifier.
**Why it happens:** Suppressed entries are filtered for display but accidentally left in the total calculation.
**How to avoid:** Compute `total` only from the `kept` array, not from all active entries.

### Pitfall 5: nat 1 Can Still Be a Success
**What goes wrong:** Engine hard-codes "nat 1 = critical failure" or "nat 1 = failure".
**Why it happens:** Common RPG intuition; other games work this way.
**How to avoid:** Nat 1 is only a shift, not an override. `computeDegree(21, 10, 1)` should return `success` (base is crit-success [21 vs DC 10 = +11], shifted down to success).
**Warning signs:** Test "1d20 rolls 1, total 22, DC 10 → success" fails.

---

## Code Examples

### Full Degree of Success Edge Case Table

```typescript
// Source: PF2e CRB, Archives of Nethys — confirmed via official SRD

// Standard cases
computeDegree(25, 15, 7)  // total beats DC by 10+ → crit-success, no shift
computeDegree(18, 15, 8)  // total beats DC by 3 → success, no shift
computeDegree(12, 15, 5)  // total below DC → failure, no shift
computeDegree(3, 15, 3)   // total below DC by 12 → crit-failure, no shift

// Nat 20 shifts
computeDegree(32, 15, 20) // base crit-success; shift to crit-success (no change, already max)
computeDegree(22, 15, 20) // base success → shift to crit-success
computeDegree(12, 15, 20) // base failure → shift to success  ← key edge case
computeDegree(2, 15, 20)  // base crit-failure [2-15=-13] → shift to failure ← key edge case

// Nat 1 shifts
computeDegree(12, 2, 1)   // base crit-success [12-2=+10] → shift to success ← key edge case
computeDegree(4, 2, 1)    // base success → shift to failure
computeDegree(0, 2, 1)    // base failure → shift to crit-failure
computeDegree(-5, 2, 1)   // base crit-failure; shift to crit-failure (no change, already min)
```

### Installing and Configuring the Dice Library

```typescript
// Source: https://dice-roller.github.io/documentation/guide/customisation.html
import { DiceRoll, NumberGenerator } from '@dice-roller/rpg-dice-roller';

// Set browserCrypto globally — call once at app/module init
NumberGenerator.generator.engine = NumberGenerator.engines.browserCrypto;

// Rolling
const roll = new DiceRoll('1d20+15');
console.log(roll.total);   // e.g. 32
console.log(roll.output);  // "[17]+15 = 32"
console.log(roll.notation); // "1d20+15"
```

### Detecting Natural Die Value

```typescript
// Source: https://dice-roller.github.io/documentation/api/results/RollResult.html
// RollResult.initialValue = raw die face before any modifier is applied

function extractDieValues(roll: DiceRoll): number[] {
  const values: number[] = [];
  for (const group of roll.rolls) {
    if (group && typeof group === 'object' && 'rolls' in group) {
      const results = (group as { rolls: Array<{ initialValue: number }> }).rolls;
      for (const r of results) {
        values.push(r.initialValue);
      }
    }
  }
  return values;
}
```

### Test Pattern (following established Phase 2 TDD)

```typescript
// Filename: src/lib/engine/degree.unit.test.ts
import { describe, it, expect } from 'vitest';
import { computeDegree } from './degree';

describe('computeDegree — nat 1 edge cases', () => {
  it('nat 1 with modifier high enough to crit-succeed still yields success', () => {
    // total=22, dc=10: diff=+12 → base crit-success; nat 1 shifts down to success
    const result = computeDegree(22, 10, 1);
    expect(result.degree).toBe('success');
    expect(result.baseDegree).toBe('critical-success');
    expect(result.shifted).toBe(true);
    expect(result.shiftDirection).toBe('down');
  });

  it('nat 20 that misses DC by 10+ yields failure not success', () => {
    // total=5, dc=20: diff=-15 → base crit-failure; nat 20 shifts up to failure
    const result = computeDegree(5, 20, 20);
    expect(result.degree).toBe('failure');
    expect(result.baseDegree).toBe('critical-failure');
    expect(result.shifted).toBe(true);
  });

  it('nat 20 already at crit-success: no shift, shifted=false', () => {
    const result = computeDegree(30, 15, 20);
    expect(result.degree).toBe('critical-success');
    expect(result.shifted).toBe(false);
  });
});

describe('computeMAP', () => {
  it('agile: 0 / -4 / -8', () => {
    expect(computeMAP(1, true)).toBe(0);
    expect(computeMAP(2, true)).toBe(-4);
    expect(computeMAP(3, true)).toBe(-8);
  });
  it('standard: 0 / -5 / -10', () => {
    expect(computeMAP(1, false)).toBe(0);
    expect(computeMAP(2, false)).toBe(-5);
    expect(computeMAP(3, false)).toBe(-10);
  });
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Math.random() for dice | crypto.getRandomValues via `browserCrypto` engine | PF2e community standard since ~2020 | Cryptographically uniform distribution; verified in Phase 1 |
| Hand-rolling modifier tables | `@dice-roller/rpg-dice-roller` v5 | Library reached v5 with full TS types | Less code to maintain; notation extensible for free-form dice (Phase 4) |
| Flat modifier total only | Typed breakdown (status/circumstance/item/untyped) | PF2e 2e launch 2019 | Required for correct stacking and for ROLL-05 "labeled breakdown" display |

**Deprecated/outdated:**
- `rpg-dice-roller` (v4 unscoped package): replaced by `@dice-roller/rpg-dice-roller` v5; do not install the old unscoped package

---

## Open Questions

1. **`browserCrypto` availability in Vitest node environment**
   - What we know: Phase 1 confirmed `crypto.getRandomValues` works in browser (Vitest browser project). Node 19+ exposes `globalThis.crypto` but Node 18 may not.
   - What's unclear: The `unit` Vitest project runs in node env; if the CI uses Node 18, `browserCrypto` will fail.
   - Recommendation: In `dice.ts`, export a `configureEngine(engine)` function. Default to `browserCrypto` in production; in unit tests, call `configureEngine(NumberGenerator.engines.nativeMath)` in `beforeAll`. This is clean and testable.

2. **TypeScript types for `DiceRoll.rolls` internal structure**
   - What we know: `rolls` is typed as `Array<ResultGroup | RollResults | string | number>`. `RollResult.initialValue` exists per official API docs.
   - What's unclear: Whether TypeScript type definitions export `RollResult` with `initialValue` cleanly or require casting.
   - Recommendation: Access via type assertion (`as { rolls: Array<{ initialValue: number }> }`). Write a unit test that verifies `initialValue` equals the die face after a known roll — this will catch any API version mismatch at test time.

3. **Penalty stacking clarification: do typed penalties stack with each other?**
   - What we know: PF2e RAW (AoN ID 22) says "you take only the worst of various penalties of a given type." This means typed penalties do NOT all stack — only the worst applies.
   - What's unclear: Some community sources describe this inconsistently.
   - Recommendation: Implement "worst typed penalty" per the verified AoN source. The code example above implements this correctly. The test cases should cover "frightened 2 + frightened 3 = only -3 applies."

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.0 |
| Config file | `vitest.config.ts` (already exists) |
| Quick run command | `npm run test:unit` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DGRN-01 | `computeDegree` accepts any DC value | unit | `npm run test:unit -- degree` | ❌ Wave 0 |
| DGRN-02 | Base degree correct for all 4 cases (±10 threshold) | unit | `npm run test:unit -- degree` | ❌ Wave 0 |
| DGRN-03 | Nat 20 shifts up exactly 1 step | unit | `npm run test:unit -- degree` | ❌ Wave 0 |
| DGRN-04 | Nat 1 shifts down exactly 1 step | unit | `npm run test:unit -- degree` | ❌ Wave 0 |
| DGRN-05 | `DEGREE_COLORS` map returns Foundry color tokens | unit | `npm run test:unit -- degree` | ❌ Wave 0 |
| MODF-01 | Status bonus stacking: highest wins | unit | `npm run test:unit -- modifiers` | ❌ Wave 0 |
| MODF-02 | Circumstance bonus stacking: highest wins | unit | `npm run test:unit -- modifiers` | ❌ Wave 0 |
| MODF-03 | Item bonus stacking: highest wins | unit | `npm run test:unit -- modifiers` | ❌ Wave 0 |
| MODF-04 | Typed penalty: worst applies; untyped: all stack | unit | `npm run test:unit -- modifiers` | ❌ Wave 0 |
| MODF-05 | Untyped penalties all stack | unit | `npm run test:unit -- modifiers` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:unit`
- **Per wave merge:** `npm test` (runs both unit and browser suites)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/engine/degree.unit.test.ts` — covers DGRN-01 through DGRN-05
- [ ] `src/lib/engine/modifiers.unit.test.ts` — covers MODF-01 through MODF-05
- [ ] `src/lib/engine/dice.unit.test.ts` — covers dice rolling + naturalDie extraction
- [ ] `src/lib/engine/map.unit.test.ts` — covers agile and standard MAP
- [ ] No new framework install needed — Vitest unit project already configured

---

## Sources

### Primary (HIGH confidence)
- Archives of Nethys — [Step 4: Degree of Success](https://2e.aonprd.com/Rules.aspx?ID=2286) — confirmed base degree algorithm
- Archives of Nethys — [Natural 1 and Natural 20](https://2e.aonprd.com/Rules.aspx?ID=2287) — confirmed shift order and edge cases
- Archives of Nethys — [Bonuses and Penalties](https://2e.aonprd.com/Rules.aspx?ID=22) — confirmed typed stacking rules
- rpg-dice-roller official docs — [Customisation guide](https://dice-roller.github.io/documentation/guide/customisation.html) — `browserCrypto` engine setup
- rpg-dice-roller official docs — [RollResult API](https://dice-roller.github.io/documentation/api/results/RollResult.html) — `initialValue` property confirmed

### Secondary (MEDIUM confidence)
- [rpg-dice-roller DiceRoll API](https://dice-roller.github.io/documentation/api/DiceRoll.html) — `rolls`, `total`, `notation`, `output` properties (WebFetch; official docs)
- [rpg-dice-roller RollResults API](https://dice-roller.github.io/documentation/api/results/RollResults.html) — `.rolls` array structure (WebFetch; official docs)

### Tertiary (LOW confidence)
- Version 5.5.1 current: WebSearch result only (npm registry was 403); treat as approximate — verify with `npm info @dice-roller/rpg-dice-roller version` before installing

---

## Metadata

**Confidence breakdown:**
- PF2e rules (degree of success, modifier stacking, MAP): HIGH — confirmed via Archives of Nethys official SRD
- @dice-roller/rpg-dice-roller API (DiceRoll, NumberGenerator, browserCrypto): HIGH — confirmed via official documentation
- RollResult.initialValue for nat-die detection: MEDIUM — official API docs confirm property exists; TypeScript type shape needs verification at install time
- Library version (5.5.1): LOW — npm registry returned 403; verify before npm install

**Research date:** 2026-03-15
**Valid until:** 2026-06-15 (stable rules; library API changes infrequently)
