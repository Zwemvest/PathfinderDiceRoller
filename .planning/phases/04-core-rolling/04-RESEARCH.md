# Phase 4: Core Rolling - Research

**Researched:** 2026-03-15
**Domain:** Svelte 5 component wiring, Dexie schema migration, modal/dialog patterns, Svelte stores for cross-component state
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Roll Result Card:** Compact by default — roll label, total (bold), DoS badge. Tap to expand: full modifier breakdown by category. Natural d20 highlighted. DoS as colored inline badge. Colors: Gold=crit success, Green=success, Orange=failure, Red=crit failure.
- **Roll Interaction Flow:** Tapping a skill/save/perception opens a pre-roll dialog (not instant roll). Dialog shows: roll label, base modifier, active modifier toggles (PRESET_MODIFIERS), DC entry field. User toggles, enters DC, confirms to roll. Result appears in persistent RollResultCard. DC can also be edited post-roll on the result card and in the dice tray.
- **Initiative:** "Roll Initiative" button opens pre-roll dialog. Default: Perception. Dropdown to pick a different skill. Same pre-roll dialog with modifier toggles.
- **Free-Form Dice Tray:** Text input + Roll button. Collapsed by default (small bar), tap to expand. No quick-pick dice buttons. Results appear in same RollResultCard. Free-form rolls appear in roll history.
- **Roll History Tab:** Minimal one-liner list "Athletics +15 = 23 [Success]". Tap entry to see full result card view. Last 100 rolls, auto-prune oldest. Clear History button with confirmation dialog. Persists across sessions (IndexedDB). All characters intermixed chronologically with character name shown.

### Claude's Discretion
- Pre-roll dialog layout and animations
- How modifier toggles are displayed in the dialog (chips, switches, checkboxes)
- Dice tray collapse/expand animation
- History entry timestamp format
- How free-form roll labels appear vs character roll labels
- Whether to auto-scroll history to latest roll

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ROLL-01 | User can click a skill to roll with correct modifier | NormalizedSkill.total is pre-computed; rollExpression('1d20+{total}') + resolveModifiers for presets |
| ROLL-02 | User can click a saving throw (Fortitude, Reflex, Will) to roll with correct modifier | NormalizedSaves.{fortitude/reflex/will} is pre-computed total; same roll path as skills |
| ROLL-03 | User can click Perception to roll with correct modifier | NormalizedCharacter.perception is pre-computed total; clickable badge in CharacterDashboard |
| ROLL-04 | User can roll Initiative (using Perception or a selected skill) | Initiative = perception by default; skill picker dropdown in pre-roll dialog |
| ROLL-05 | Roll result card shows labeled modifier breakdown | resolveModifiers().breakdown gives per-category subtotals; RollResultCard renders kept[] entries |
| DICE-01 | User can type arbitrary dice expressions (3d6+2, 2d8dh, 4d6kh3) | rollExpression() from @dice-roller/rpg-dice-roller handles all standard notations |
| DICE-02 | Dice syntax supports drop highest/lowest (dh, dl) | @dice-roller/rpg-dice-roller supports dh/dl natively |
| DICE-03 | Dice syntax supports keep highest/lowest (kh, kl) | @dice-roller/rpg-dice-roller supports kh/kl natively |
| DICE-04 | User can add typed bonuses/penalties to free-form rolls | Pre-roll dialog modifier toggles apply equally to free-form rolls via resolveModifiers |
| DICE-05 | Free-form rolls appear in roll history | Same saveRollHistory() path as character rolls; label type distinguishes them |
| HIST-01 | All rolls recorded in scrollable audit log | Dexie rollHistory table; liveQuery for reactive list; history page renders entries |
| HIST-02 | Each entry shows roll type, dice expression, dice results, modifiers, total, DoS | RollHistoryEntry schema must be expanded to store full RollSnapshot |
| HIST-03 | Roll history persists across browser sessions (IndexedDB) | Dexie rollHistory table already exists; schema migration to v3 for richer data |
| HIST-04 | User can clear roll history | db.rollHistory.clear() with confirmation dialog |
</phase_requirements>

---

## Summary

Phase 4 is the first end-to-end user experience — tap a skill, get a result. All the engine pieces exist and are tested (rollExpression, computeDegree, resolveModifiers, PRESET_MODIFIERS). The work is purely UI wiring: three new/rebuilt components (PreRollDialog, RollResultCard, DiceTray), click handlers on three existing character display components, a richer DB schema for history entries, and a complete History tab page.

The central architecture challenge is **shared roll state**: the last roll result must be visible from any route (it sits in the persistent layout), and the pre-roll dialog must be openable from three different components. The idiomatic Svelte 5 solution is a module-level `$state()` singleton (a "store-like" rune module) — no Svelte stores, no context API, just a plain `.svelte.ts` file exported and imported wherever needed.

The DB schema needs one migration (v2 → v3) to expand `RollHistoryEntry` from its current minimal shape (expression, result) to a `RollSnapshot` that captures the full breakdown required by HIST-02. The 100-entry limit with auto-prune is a straightforward pre-write check.

**Primary recommendation:** Use a module-level Svelte 5 rune state file (`src/lib/state/roll.svelte.ts`) for cross-component roll state; use Dexie `liveQuery` for reactive history rendering; keep each new component in `src/lib/components/rolling/`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte 5 runes | (project baseline) | Reactive state, component authoring | Already established in Phases 1-3 |
| @dice-roller/rpg-dice-roller | (installed) | Parse and roll all dice notations | Already used in engine/dice.ts |
| Dexie | (installed) | IndexedDB ORM for roll history persistence | Already established, liveQuery for reactivity |
| Tailwind CSS v4 | (installed) | Utility-first styling with @theme tokens | Already established |
| Vitest (browser + unit modes) | (installed) | Testing new components and DB helpers | Already established |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `dexie` `liveQuery` | (installed) | Reactive Dexie query that re-runs on DB change | History tab — auto-updates when new rolls land |
| Svelte `dialog` element | native HTML | Pre-roll dialog modal | Use native `<dialog>` — no extra library needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Module-level rune state | Svelte context API (`setContext`/`getContext`) | Context is component-tree scoped — doesn't work across routes in the same layout; rune module is simpler |
| Module-level rune state | Svelte 4 writable stores | Stores still work in Svelte 5 but rune modules are the idiomatic replacement; consistency with rest of codebase |
| Native `<dialog>` | Third-party modal library | No dependency needed; native dialog handles focus trap and escape-key close for free |

**Installation:** No new packages needed — all dependencies are already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
src/lib/
├── state/
│   └── roll.svelte.ts       # Module-level roll state (last result, dialog open/closed)
├── components/
│   ├── rolling/
│   │   ├── PreRollDialog.svelte      # Modal: label, modifier toggles, DC, Roll button
│   │   ├── RollResultCard.svelte     # Rebuilt: compact/expanded, DoS badge, breakdown
│   │   ├── DiceTray.svelte           # Rebuilt: collapsible, text input, Roll button
│   │   └── HistoryEntry.svelte       # Single row in history list
│   └── character/
│       ├── SkillsSection.svelte      # Add onclick to each skill row
│       ├── SavesSection.svelte       # Add onclick to each save card
│       └── CharacterDashboard.svelte # Add onclick to Perception badge
src/lib/db/
│   └── index.ts                      # v3 schema migration + saveRoll / getRollHistory helpers
src/routes/
│   └── history/
│       └── +page.svelte              # Full implementation replacing stub
```

### Pattern 1: Module-Level Rune State (Cross-Component Shared State)

**What:** A `.svelte.ts` file that exports reactive state using `$state()` at module level. Any component that imports it reads and writes the same reactive instance.

**When to use:** When state must be shared between components that are not in a parent-child relationship — e.g., the pre-roll dialog triggered from SkillsSection must populate RollResultCard which lives in the root layout.

**Example:**
```typescript
// src/lib/state/roll.svelte.ts
import type { DiceRollResult } from '$lib/engine/dice';
import type { DegreeResult } from '$lib/engine';
import type { RollSnapshot } from '$lib/db';

// The currently displayed roll result (null = no roll yet)
export const rollState = $state<{
  snapshot: RollSnapshot | null;
  expanded: boolean;
}>({ snapshot: null, expanded: false });

// The pre-roll dialog open state
export const dialogState = $state<{
  open: boolean;
  label: string;
  baseModifier: number;
  rollType: 'skill' | 'save' | 'perception' | 'initiative' | 'free-form';
  skillSlug?: string;
}>({ open: false, label: '', baseModifier: 0, rollType: 'skill' });

// Opens the pre-roll dialog for a character check
export function openPreRollDialog(label: string, baseModifier: number, rollType: 'skill' | 'save' | 'perception' | 'initiative', skillSlug?: string) {
  dialogState.open = true;
  dialogState.label = label;
  dialogState.baseModifier = baseModifier;
  dialogState.rollType = rollType;
  dialogState.skillSlug = skillSlug;
}
```

### Pattern 2: RollSnapshot — The Canonical Roll Record

**What:** A single interface that captures everything about a completed roll. Used as both the in-memory result display type AND the DB persistence shape.

**When to use:** Define once, use everywhere — avoids impedance mismatch between "what we display" and "what we store".

**Example:**
```typescript
// src/lib/db/index.ts (addition to existing file)
export interface RollSnapshot {
  id?: number;
  rolledAt: Date;
  characterName: string;        // e.g. "Knurvik" or "Free-form"
  label: string;                // e.g. "Athletics", "Fortitude", "2d8+4"
  rollType: 'skill' | 'save' | 'perception' | 'initiative' | 'free-form';
  notation: string;             // e.g. "1d20+15"
  dieResults: number[];         // raw die faces
  naturalDie: number;           // first die (for nat 20/1 highlight)
  modifierTotal: number;        // net modifier (from character + presets)
  total: number;                // final roll total
  keptModifiers: string;        // JSON-serialized kept[] array for breakdown display
  dc: number | null;            // null = no DC entered
  degree: string | null;        // 'critical-success' | 'success' etc, null if no DC
  shifted: boolean;             // nat 20/1 shifted the degree?
  shiftDirection: string | null; // 'up' | 'down' | null
}
```

### Pattern 3: Dexie liveQuery for Reactive History

**What:** `liveQuery(() => db.rollHistory.orderBy('rolledAt').reverse().limit(100).toArray())` returns an Observable. Svelte's `from()` converts it to a store. As of Svelte 5, use it with `$state` and an `$effect`.

**When to use:** The history tab must automatically update when a new roll is saved, without manual refresh.

**Example:**
```typescript
// Inside +page.svelte (history route)
import { liveQuery } from 'dexie';
import { db } from '$lib/db';

// liveQuery returns an Observable — subscribe in $effect
let rolls = $state<RollSnapshot[]>([]);

$effect(() => {
  const obs = liveQuery(() =>
    db.rollHistory.orderBy('rolledAt').reverse().limit(100).toArray()
  );
  const sub = obs.subscribe({ next: (data) => { rolls = data as RollSnapshot[]; } });
  return () => sub.unsubscribe();
});
```

### Pattern 4: Native `<dialog>` for Pre-Roll Modal

**What:** Use the HTML `<dialog>` element with `showModal()` / `close()`. The browser handles focus trapping and Escape key.

**When to use:** Any modal that needs to block interaction with the background and support Escape-to-close.

**Example:**
```svelte
<!-- PreRollDialog.svelte -->
<script lang="ts">
  import { dialogState } from '$lib/state/roll.svelte';

  let dialogEl = $state<HTMLDialogElement | null>(null);

  $effect(() => {
    if (!dialogEl) return;
    if (dialogState.open) {
      dialogEl.showModal();
    } else {
      dialogEl.close();
    }
  });

  function handleClose() {
    dialogState.open = false;
  }
</script>

<dialog bind:this={dialogEl} onclose={handleClose} class="...">
  <!-- dialog content -->
</dialog>
```

### Pattern 5: Auto-Prune on Roll Save

**What:** Before saving a new roll, check the count. If it's >= 100, delete the oldest entries first.

**When to use:** On every roll save.

**Example:**
```typescript
// src/lib/db/index.ts
export async function saveRoll(snapshot: Omit<RollSnapshot, 'id'>): Promise<number> {
  const count = await db.rollHistory.count();
  if (count >= 100) {
    // Delete oldest (lowest rolledAt) to stay within limit
    const oldest = await db.rollHistory.orderBy('rolledAt').limit(count - 99).primaryKeys();
    await db.rollHistory.bulkDelete(oldest);
  }
  return db.rollHistory.add(snapshot as RollSnapshot);
}
```

### Anti-Patterns to Avoid

- **Passing roll state as props through the component tree:** The pre-roll dialog sits inside SkillsSection, but the result needs to display in RollResultCard in the root layout. Props can't bridge that gap — use the module-level state singleton.
- **Storing only `expression` and `result` in history:** The existing `RollHistoryEntry` schema is too thin for HIST-02. The schema migration to v3 replaces it with `RollSnapshot`.
- **Calling `rollExpression` with the total modifier baked into notation string at parse time:** Build the notation string at roll time: `"1d20+" + (baseModifier + resolvedPresets.total)`.
- **Using `$effect` to open the dialog directly:** Drive open/close from the `$state` flag, not from imperative effect triggers — keeps state as the single source of truth.
- **Using `sveltekit()` in vitest.config.ts:** Already fixed in Phase 1 — do not change the vitest config.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dice expression parsing | Custom parser for "2d8dh+4" | `rollExpression()` from existing engine | @dice-roller/rpg-dice-roller handles all PF2e notation including kh/kl/dh/dl; custom parsers always miss edge cases |
| Modal focus trapping | Custom focus management code | Native `<dialog>` with `showModal()` | Browser handles focus trap, Escape key, ARIA `role="dialog"` automatically |
| Modifier stacking | Custom stacking logic in component | `resolveModifiers()` from existing engine | PF2e stacking rules are already correct and tested; duplicating in the UI layer creates divergence risk |
| Degree of success coloring | Custom color map | `DEGREE_COLORS` from existing engine | Already uses Foundry-compatible hex values; changing here would diverge from the established constants |
| Reactive DB list | Manual db.rollHistory.toArray() + event listeners | Dexie `liveQuery` | liveQuery handles all the subscription plumbing; manual polling will miss concurrent writes |

**Key insight:** The engine is complete and tested. Phase 4's job is plumbing, not computation — every calculation is delegated back to the engine.

---

## Common Pitfalls

### Pitfall 1: keptModifiers Serialization in DB

**What goes wrong:** `RollSnapshot.keptModifiers` stores `ModifierEntry[]` — a structured type — in Dexie. Dexie can store nested objects natively (IndexedDB supports structured clone), but if you try to index it as a string field, it fails.

**Why it happens:** Dexie schema strings define indexed fields. Nested objects cannot be used as index keys.

**How to avoid:** Store `keptModifiers` as a JSON string (`JSON.stringify(kept)`), and parse it back when rendering the history detail view. Do not attempt to index it in the Dexie schema string.

**Warning signs:** Dexie throwing "Key path 'keptModifiers' does not point to a valid key" during schema definition.

### Pitfall 2: Module-Level `$state()` Only Works in `.svelte.ts` Files

**What goes wrong:** Putting `$state()` in a `.ts` file (not `.svelte.ts`) causes a compiler error: "rune $state can only be used in .svelte or .svelte.ts files".

**Why it happens:** Svelte runes are transformed at compile time. The `.svelte.ts` extension tells the Svelte compiler to process the file.

**How to avoid:** Name the state module `roll.svelte.ts`, not `roll.ts`.

**Warning signs:** TypeScript error about $state not being defined, or runtime error at import time.

### Pitfall 3: Dialog `onclose` vs `oncancel` Distinction

**What goes wrong:** Native `<dialog>` fires `close` when dismissed any way (Escape, `close()`, form submit). It fires `cancel` only on Escape. If you only listen to `cancel`, programmatic `close()` calls won't update your state flag.

**Why it happens:** The two events serve different use cases.

**How to avoid:** Listen to `onclose` to sync `dialogState.open = false`. Do not rely on `oncancel` alone.

### Pitfall 4: Dexie v3 Schema Migration Must Increment Version

**What goes wrong:** Adding fields to `RollSnapshot` while keeping `version(2)` causes Dexie to throw "VersionError: The requested version is less than the existing version".

**Why it happens:** Dexie uses version numbers to know when to run `.upgrade()` callbacks.

**How to avoid:** Add `version(3)` block to the database class. The `rollHistory` table existed in v2 with schema `'++id, rolledAt'` — keep the same index signature (new fields are automatically stored without being indexed). No `.upgrade()` callback is needed since old history entries can simply be discarded (or left as-is with missing fields, which render gracefully).

**Warning signs:** Dexie VersionError on first load after schema change in dev.

### Pitfall 5: Free-Form Roll naturalDie for Non-d20 Expressions

**What goes wrong:** For "2d6+4", `naturalDie` is `dieResults[0]`, which is the first d6. Passing this to `computeDegree()` as if it were a d20 face produces nonsense DoS results.

**Why it happens:** `naturalDie` is only meaningful for d20 checks. Free-form rolls are not d20 checks.

**How to avoid:** For free-form rolls, never call `computeDegree()` unless the expression is exactly `1d20+N`. Check the notation string: if it doesn't start with `1d20`, treat `dc` as null and skip degree computation. Store `degree: null` in the RollSnapshot.

### Pitfall 6: `$state()` Reactive Objects — Mutation vs Reassignment

**What goes wrong:** `dialogState.open = true` works. `dialogState = { ...dialogState, open: true }` also works but creates a new reactive object, potentially breaking bindings.

**Why it happens:** Svelte 5 `$state` objects track individual property mutations via Proxy.

**How to avoid:** Always mutate properties directly (`dialogState.open = true`), not by reassigning the whole object.

---

## Code Examples

Verified patterns from the existing codebase:

### Building Roll Notation from Character Data
```typescript
// For a character check (skill/save/perception):
// baseModifier = NormalizedSkill.total (pre-computed in Phase 2)
// presetsTotal = resolveModifiers(activatedPresets).total
const notation = `1d20+${baseModifier + presetsTotal}`;
const roll = rollExpression(notation);
const degree = dc !== null ? computeDegree(roll.total, dc, roll.naturalDie) : null;
```

### Saving a Roll to History
```typescript
const snapshot: Omit<RollSnapshot, 'id'> = {
  rolledAt: new Date(),
  characterName: character.name,
  label: 'Athletics',
  rollType: 'skill',
  notation: roll.notation,
  dieResults: roll.dieResults,
  naturalDie: roll.naturalDie,
  modifierTotal: baseModifier + presetsTotal,
  total: roll.total,
  keptModifiers: JSON.stringify(resolved.kept),
  dc: dc,
  degree: degree?.degree ?? null,
  shifted: degree?.shifted ?? false,
  shiftDirection: degree?.shiftDirection ?? null,
};
await saveRoll(snapshot);
```

### Rendering a DoS Badge (using existing DEGREE_COLORS)
```svelte
<script lang="ts">
  import { DEGREE_COLORS } from '$lib/engine';
  // snapshot.degree is 'critical-success' | 'success' | 'failure' | 'critical-failure' | null
</script>

{#if snapshot.degree}
  <span
    class="text-xs font-bold uppercase px-2 py-0.5 rounded"
    style="background-color: {DEGREE_COLORS[snapshot.degree]}20; color: {DEGREE_COLORS[snapshot.degree]}"
  >
    {snapshot.degree.replace('-', ' ')}
  </span>
{/if}
```

### Formatters for History One-Liner
```typescript
// "Athletics +15 = 23 [Success]"
function formatHistoryLine(snap: RollSnapshot): string {
  const mod = snap.modifierTotal >= 0 ? `+${snap.modifierTotal}` : `${snap.modifierTotal}`;
  const dos = snap.degree ? ` [${snap.degree.replace('-', ' ')}]` : '';
  return `${snap.label} ${mod} = ${snap.total}${dos}`;
}
```

### Rendering Modifier Breakdown in RollResultCard (Expanded)
```typescript
// keptModifiers stored as JSON string
const kept: ModifierEntry[] = JSON.parse(snapshot.keptModifiers);
// Group by type for display: kept.filter(e => e.type === 'status'), etc.
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Svelte writable stores | Module-level `$state()` in `.svelte.ts` files | Svelte 5 (this project) | Rune state is simpler, typed, and co-locates reactivity with data |
| `dialog` polyfills | Native `<dialog>` element | All modern browsers 2022+ | No dependency; built-in accessibility |
| Manual IndexedDB subscription for reactivity | Dexie `liveQuery` | Dexie 3.x | Automatic re-render on writes from any tab |

**Deprecated/outdated:**
- `RollHistoryEntry` (existing): Too thin — replace with `RollSnapshot` via Dexie v3 migration.
- Svelte 4 `$:` reactive declarations: Already avoided per Phase 1 decisions; use `$derived()`.

---

## Open Questions

1. **Initiative display location**
   - What we know: "Roll Initiative" is a button, but CharacterDashboard doesn't currently have one.
   - What's unclear: Where exactly does the Roll Initiative button live — inside CharacterDashboard below the Perception badge, or as a separate button on the character tab?
   - Recommendation: Planner decides placement; a small "Roll Initiative" button below the AC/Perception row in CharacterDashboard is the most natural spot, consistent with the existing display.

2. **Pre-roll dialog modifier toggle UI style**
   - What we know: Claude's discretion per CONTEXT.md.
   - What's unclear: Chip/toggle vs checkbox vs switch — each has different tap-target implications on mobile.
   - Recommendation: Use pill-shaped toggleable chips (button elements with active/inactive styling) — largest tap target, visually scannable, no extra dependency.

3. **History tab scroll direction**
   - What we know: "Roll history should feel like a chat log — newest at bottom, scrolls up for older rolls" (from CONTEXT.md specifics).
   - What's unclear: Newest-at-bottom with reversed liveQuery, or CSS `flex-direction: column-reverse`?
   - Recommendation: Use `orderBy('rolledAt').reverse()` in the liveQuery (newest first in array) then render the list in reverse DOM order, OR use CSS `flex-direction: column-reverse` on the list container. The `orderBy().reverse().limit(100)` approach is simpler because it also respects the 100-entry limit naturally.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1 (browser mode + unit mode) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROLL-01 | Clicking skill row opens pre-roll dialog | browser | `npx vitest run --project=browser --reporter=verbose` | ❌ Wave 0 |
| ROLL-02 | Clicking save card opens pre-roll dialog | browser | `npx vitest run --project=browser --reporter=verbose` | ❌ Wave 0 |
| ROLL-03 | Clicking Perception badge opens pre-roll dialog | browser | `npx vitest run --project=browser --reporter=verbose` | ❌ Wave 0 |
| ROLL-04 | Roll Initiative opens dialog with Perception default + skill picker | browser | `npx vitest run --project=browser --reporter=verbose` | ❌ Wave 0 |
| ROLL-05 | RollResultCard expanded view shows labeled modifier breakdown | browser | `npx vitest run --project=browser --reporter=verbose` | ❌ Wave 0 |
| DICE-01 | rollExpression handles '3d6+2', '2d8dh', '4d6kh3' | unit | `npx vitest run --project=unit --reporter=verbose` | ✅ (dice.unit.test.ts — extend) |
| DICE-02/03 | Drop/keep highest/lowest notation parses correctly | unit | `npx vitest run --project=unit --reporter=verbose` | ❌ Wave 0 (extend dice.unit.test.ts) |
| DICE-04 | Modifier toggles apply to free-form rolls | browser | `npx vitest run --project=browser --reporter=verbose` | ❌ Wave 0 |
| DICE-05 | Free-form roll appears in roll history | browser | `npx vitest run --project=browser --reporter=verbose` | ❌ Wave 0 |
| HIST-01 | History tab renders list of rolls | browser | `npx vitest run --project=browser --reporter=verbose` | ❌ Wave 0 |
| HIST-02 | History entry expanded view shows full breakdown | browser | `npx vitest run --project=browser --reporter=verbose` | ❌ Wave 0 |
| HIST-03 | saveRoll persists; getRollHistory returns it after db.close/open | browser | `npx vitest run --project=browser --reporter=verbose` | ❌ Wave 0 |
| HIST-04 | Clear History deletes all entries from DB | browser | `npx vitest run --project=browser --reporter=verbose` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/state/roll.svelte.ts` — module exists (no test needed — tested via component tests)
- [ ] `src/lib/components/rolling/PreRollDialog.browser.test.ts` — covers ROLL-01 through ROLL-04
- [ ] `src/lib/components/rolling/RollResultCard.browser.test.ts` — covers ROLL-05
- [ ] `src/lib/components/rolling/DiceTray.browser.test.ts` — covers DICE-01 through DICE-05
- [ ] `src/lib/db/roll.browser.test.ts` — covers HIST-01 through HIST-04 (saveRoll, getRollHistory, clear, auto-prune at 100)
- [ ] Extend `src/lib/engine/dice.unit.test.ts` — add kh/kl/dh/dl notation tests for DICE-02/DICE-03

---

## Sources

### Primary (HIGH confidence)
- Read directly from `src/lib/engine/index.ts`, `types.ts`, `dice.ts`, `degree.ts`, `modifiers.ts`, `presets.ts` — all engine APIs verified
- Read directly from `src/lib/db/index.ts` — current Dexie schema, existing CRUD helpers
- Read directly from `src/lib/parsers/types.ts` — NormalizedCharacter schema including NormalizedSkill.total, NormalizedSaves fields
- Read directly from `src/lib/components/character/*.svelte` — existing component structure, click handler gaps
- Read directly from `src/routes/+layout.svelte` — RollResultCard and DiceTray placement confirmed
- Read directly from `vitest.config.ts` — test project configuration, include patterns

### Secondary (MEDIUM confidence)
- Svelte 5 rune module pattern (`.svelte.ts`) — consistent with Svelte 5 docs; used by this project in established patterns per STATE.md decisions
- Native `<dialog>` element — supported by all modern browsers; MDN Web Docs (well-established)
- Dexie `liveQuery` — documented in Dexie official docs; consistent with `optimizeDeps.include: ['dexie']` already in vitest.config.ts

### Tertiary (LOW confidence)
- None — all claims backed by direct code inspection or well-established browser API documentation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use; verified by reading source files
- Architecture: HIGH — module-level rune state pattern is the established Svelte 5 approach; all patterns are derived from existing codebase conventions
- Pitfalls: HIGH — DB migration and dialog event pitfalls are concrete, verified against the existing code structure
- Test mapping: HIGH — test infrastructure fully understood from vitest.config.ts and existing test files

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable stack — Svelte 5, Dexie, Tailwind v4 all mature)
