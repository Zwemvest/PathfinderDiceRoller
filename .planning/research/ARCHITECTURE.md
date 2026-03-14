# Architecture Research

**Domain:** Client-side PWA — PF2e Dice Roller
**Researched:** 2026-03-14
**Confidence:** HIGH (core patterns verified; PF2e bonus-stacking rules confirmed via Archives of Nethys and Foundry VTT source; PWA patterns verified via vite-plugin-pwa/Workbox official docs; JSON schemas verified against actual sample files in repo)

---

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                           UI LAYER (React)                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Character│  │  Roll    │  │  Check   │  │ Roll Log │  │   GM    │ │
│  │  Panel   │  │ Controls │  │  Prompt  │  │ (Audit)  │  │  Mode   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
└───────┼─────────────┼─────────────┼──────────────┼─────────────┼──────┘
        │             │             │              │             │
┌───────┼─────────────┼─────────────┼──────────────┼─────────────┼──────┐
│       ↓             ↓             ↓              ↓             ↓      │
│                   APPLICATION STATE (Zustand)                          │
│   activeCharacter | rollHistory | sessionState | uiState | gmRoster   │
└───────┬─────────────────────────────────────────────────────────┬──────┘
        │                                                         │
        ↓                                                         ↓
┌───────────────────────────┐            ┌────────────────────────────────┐
│    RULES ENGINE LAYER     │            │       PERSISTENCE LAYER        │
│  ┌─────────────────────┐  │            │  ┌──────────┐  ┌────────────┐ │
│  │  Modifier Resolver  │  │            │  │ IDB:chars│  │ IDB:history│ │
│  │  (bonus stacking)   │  │            │  └──────────┘  └────────────┘ │
│  └─────────────────────┘  │            │  ┌──────────┐  ┌────────────┐ │
│  ┌─────────────────────┐  │            │  │IDB:prefs │  │IDB:sessions│ │
│  │   MAP Calculator    │  │            │  └──────────┘  └────────────┘ │
│  └─────────────────────┘  │            └────────────────────────────────┘
│  ┌─────────────────────┐  │
│  │  Degree of Success  │  │            ┌────────────────────────────────┐
│  │  (crit/fail logic)  │  │            │      IMPORT / PARSE LAYER      │
│  └─────────────────────┘  │            │  ┌──────────┐  ┌────────────┐ │
│  ┌─────────────────────┐  │            │  │  Foundry │  │Pathbuilder │ │
│  │    Dice Engine      │  │            │  │  Parser  │  │  Parser    │ │
│  │  (syntax + PRNG)    │  │            │  └──────────┘  └────────────┘ │
│  └─────────────────────┘  │            │  ┌──────────────────────────┐ │
└───────────────────────────┘            │  │  Normalised Character    │ │
                                         │  │  Model (internal schema) │ │
┌──────────────────────────────────────┐ │  └──────────────────────────┘ │
│          PWA SHELL LAYER             │ └────────────────────────────────┘
│  Service Worker (vite-plugin-pwa +   │
│  Workbox) — pre-caches all assets    │
│  Theme CSS custom properties layer   │
└──────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Character Panel** | Renders all rollable actions for the active character — skills, attacks, spells, saves, perception | App state (read), Roll Controls (triggers roll) |
| **Roll Controls / Dice Engine** | Parses dice syntax, generates cryptographically random d20+modifiers, evaluates dice expressions (3d6dh, 2d8+5) | Rules Engine (modifier resolution), App state (writes roll result) |
| **Check Prompt** | Foundry-style modal: title, DC entry, difficulty adjustment, success-step adjustment, hero point reroll | Roll Controls (receives roll result), Degree-of-Success calculator |
| **Roll Log** | Scrollable, searchable audit log with session tags and timestamps; export to JSON | App state (read roll history), Persistence Layer |
| **GM Mode / Roster** | Loads and switches between multiple character sheets; delegates all roll logic to same pipeline | Import Layer (load character), App state (swap active character) |
| **Modifier Resolver** | Applies PF2e bonus-stacking rules: highest circumstance + highest status + highest item + all untyped; handles penalties; evaluates conditional modifiers | Dice Engine (provides final modifier), Character data |
| **MAP Calculator** | Tracks attack count per round (-5/-10 standard; -4/-8 agile); resets on new round | App state (tracks MAP state), Roll Controls |
| **Degree-of-Success** | Computes critical success/failure: +/-10 from DC, natural 20/1 step shift | Check Prompt, Roll Controls |
| **Foundry Parser** | Reads Foundry VTT PF2e export JSON; extracts `system.*` fields, `items[]` array (feats, weapons, spells, ancestry, background, class), `system.skills`, `system.attributes` | Normalised Character Model |
| **Pathbuilder Parser** | Reads Pathbuilder export JSON (`build.*` object); extracts pre-computed attack bonuses, skill proficiencies, spell lists, `mods` map, `weapons[]`, `armor[]`, `spellCasters[]` | Normalised Character Model |
| **Normalised Character Model** | Internal schema that both parsers write to; the single source of truth all rules engine components consume | Rules Engine, UI Layer |
| **IndexedDB Persistence** | Stores characters, roll history, session data, user preferences; accessed via idb wrapper library | App state (hydrate on boot, persist on change) |
| **Service Worker** | Pre-caches all static assets (JS, CSS, HTML, fonts) via Workbox generateSW; serves offline | Browser (intercepts fetch), App (update notification) |
| **Theme Layer** | CSS custom properties scoped to `[data-theme]` attribute; three themes toggled via class on `<html>` | UI Layer (reads theme preference from app state) |

---

## Recommended Project Structure

```
src/
├── parsers/                    # Format-specific import adapters
│   ├── foundry/
│   │   ├── foundryParser.ts    # Top-level Foundry JSON → NormalizedCharacter
│   │   ├── skillsParser.ts     # Extracts skill proficiencies + modifiers
│   │   ├── weaponsParser.ts    # Extracts weapon attack/damage data
│   │   ├── spellsParser.ts     # Extracts spell lists and DC
│   │   └── featsParser.ts      # Extracts feat names + rule elements
│   ├── pathbuilder/
│   │   ├── pathbuilderParser.ts
│   │   └── spellCastersParser.ts
│   └── normalizedCharacter.ts  # Shared internal schema (TypeScript types)
│
├── engine/                     # Pure functions — no React, no IO
│   ├── dice.ts                 # Dice expression parser + roller (crypto.getRandomValues)
│   ├── modifiers.ts            # PF2e bonus stacking, penalty application
│   ├── map.ts                  # Multiple Attack Penalty calculation
│   ├── degreeOfSuccess.ts      # Crit/fail logic, natural 20/1 step shifts
│   └── checkPrompt.ts          # DC resolution, difficulty/success-step adjustments
│
├── store/                      # Zustand slices
│   ├── characterStore.ts       # Active character(s), GM roster
│   ├── rollStore.ts            # Roll history, session tagging
│   ├── sessionStore.ts         # MAP state, hero points, round tracking
│   └── uiStore.ts              # Theme, active panel, check prompt open/closed
│
├── persistence/                # IndexedDB access via idb
│   ├── db.ts                   # Database init, schema version management
│   ├── charactersRepo.ts       # CRUD for saved characters
│   ├── historyRepo.ts          # Append-only roll history
│   └── prefsRepo.ts            # Theme, GM/Player mode, last active character
│
├── components/                 # React UI components
│   ├── character/
│   │   ├── CharacterPanel.tsx
│   │   ├── SkillList.tsx
│   │   ├── AttackList.tsx
│   │   ├── SpellList.tsx
│   │   └── SaveRow.tsx
│   ├── rolling/
│   │   ├── CheckPrompt.tsx     # Foundry-style modal
│   │   ├── RollResult.tsx      # Animated result display
│   │   └── DiceSelector.tsx    # Arbitrary dice picker
│   ├── log/
│   │   ├── RollLog.tsx
│   │   └── SessionFilter.tsx
│   ├── gm/
│   │   └── GMRoster.tsx        # Character switcher
│   └── layout/
│       ├── AppShell.tsx
│       └── ThemeSwitcher.tsx
│
├── hooks/                      # React hooks bridging store ↔ engine
│   ├── useRoll.ts              # Orchestrates a full roll: resolve mods → roll dice → log result
│   ├── useCharacterImport.ts   # File picker → parser → store
│   └── useCheckPrompt.ts       # Opens prompt, collects DC, resolves degree of success
│
├── themes/                     # CSS
│   ├── base.css                # Shared custom properties
│   ├── parchment.css           # Fantasy theme
│   ├── pathfinder.css          # Red/gold/dark official theme
│   └── modern.css              # Clean minimal theme
│
├── sw/                         # Service worker (generated by vite-plugin-pwa)
│   └── (auto-generated)
│
├── App.tsx
└── main.tsx
```

### Structure Rationale

- **parsers/**: Isolated per format so changes to Foundry schema never touch Pathbuilder logic. Each parser outputs `NormalizedCharacter` — the contract the rest of the app depends on.
- **engine/**: Pure functions with zero side effects. Testable without React or a browser. The dice engine, modifier resolver, MAP calculator, and degree-of-success logic are the core correctness guarantees.
- **store/**: Separated by concern (character vs roll vs session vs UI) to limit re-render scope. Zustand's slice pattern keeps files small.
- **persistence/**: Decoupled from store via a thin repository layer. Store hydrates from IDB on boot; writes to IDB are fire-and-forget via `zustand/middleware`-style subscriptions.
- **components/**: Grouped by UI concern, not by route. The app is single-page so route-based splitting would be artificial.
- **hooks/**: Thin orchestration layer that connects user intent (UI event) → engine computation → state update. Keeps components declarative.

---

## Architectural Patterns

### Pattern 1: Normalised Character Model (Adapter Pattern)

**What:** Both parsers write to a single internal `NormalizedCharacter` TypeScript type. The rest of the app — engine, store, UI — only knows this schema.

**When to use:** Any time you have multiple input formats that must power the same downstream logic.

**Trade-offs:** Adds an explicit mapping step but eliminates conditional logic ("if Foundry, else if Pathbuilder") scattered throughout the codebase. Worth it from day one given two source formats with significant structural differences.

**Example:**
```typescript
// parsers/normalizedCharacter.ts
export interface NormalizedCharacter {
  id: string;
  source: 'foundry' | 'pathbuilder';
  name: string;
  level: number;
  abilities: Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>;
  skills: Record<string, SkillEntry>;
  attacks: WeaponEntry[];
  spellcasting: SpellcastingEntry[];
  saves: SaveEntry;
  perception: ModifierEntry;
  feats: FeatEntry[];
  heroPoints: number;
  // ...
}

// parsers/foundry/foundryParser.ts
export function parseFoundry(raw: unknown): NormalizedCharacter {
  const json = raw as FoundryExport;
  return {
    source: 'foundry',
    name: json.name,
    level: json.system.details.level.value,
    abilities: resolveFoundryAbilities(json),
    // ...
  };
}
```

### Pattern 2: Pure Engine Functions (No Side Effects)

**What:** All dice rolling, modifier resolution, and degree-of-success computation are pure functions. They receive data, return results, and touch no external state.

**When to use:** Always for rules logic. The correctness of the rules engine is the product's core value proposition — it must be independently testable.

**Trade-offs:** Requires explicit threading of data from store into engine calls. This is a feature, not a bug — it makes data flow visible.

**Example:**
```typescript
// engine/modifiers.ts
export function resolveModifiers(mods: Modifier[]): ResolvedModifier {
  const circumstance = Math.max(...mods.filter(m => m.type === 'circumstance').map(m => m.value), 0);
  const status = Math.max(...mods.filter(m => m.type === 'status').map(m => m.value), 0);
  const item = Math.max(...mods.filter(m => m.type === 'item').map(m => m.value), 0);
  const untyped = mods.filter(m => m.type === 'untyped').reduce((sum, m) => sum + m.value, 0);
  // penalties: worst circumstance + worst status + all untyped penalties
  return { circumstance, status, item, untyped, total: circumstance + status + item + untyped };
}

// engine/dice.ts
export function rollDice(expression: string): RollResult {
  // parse "3d6dh" or "2d8+5", use crypto.getRandomValues for PRNG
}
```

### Pattern 3: Zustand Slices + IDB Subscription

**What:** Each Zustand store slice exposes state and actions. IDB writes are attached as subscriptions on the store — when state changes, the persistence layer writes asynchronously.

**When to use:** Anywhere you need optimistic UI (instant update) with background persistence. Avoids blocking the UI on IDB writes.

**Trade-offs:** State is the truth; IDB is the backup. On boot, the store hydrates from IDB before render. This requires a "hydrated" flag to prevent rendering stale data.

**Example:**
```typescript
// store/characterStore.ts
export const useCharacterStore = create<CharacterStore>()(
  subscribeWithSelector((set, get) => ({
    characters: {},
    activeId: null,
    addCharacter: (char) => set(s => ({ characters: { ...s.characters, [char.id]: char } })),
  }))
);

// persistence: subscribe and write to IDB on change
useCharacterStore.subscribe(
  (state) => state.characters,
  (characters) => charactersRepo.saveAll(characters),
);
```

### Pattern 4: Check Prompt as an Async Flow

**What:** The Check Prompt modal is invoked as a promise that resolves when the user confirms or cancels. The calling hook awaits the result before proceeding to roll.

**When to use:** Any multi-step user interaction where the next step depends on user input before computation can proceed.

**Trade-offs:** Cleaner than managing prompt-open state across multiple components; keeps the roll orchestration linear.

**Example:**
```typescript
// hooks/useRoll.ts
async function rollSkillCheck(skill: SkillEntry) {
  const promptResult = await openCheckPrompt({ title: skill.label, defaultDC: null });
  if (!promptResult) return; // user cancelled
  const mods = resolveModifiers(skill.modifiers);
  const roll = rollDice(`1d20+${mods.total}`);
  const degree = promptResult.dc
    ? degreeOfSuccess(roll.total, promptResult.dc, roll.natural)
    : null;
  appendToHistory({ skill, roll, degree, timestamp: Date.now(), sessionId: currentSession });
}
```

---

## Data Flow

### Import Flow (character load)

```
User selects JSON file
    ↓
useCharacterImport hook reads File via FileReader API
    ↓
Detects format (Foundry: root "system" key present; Pathbuilder: root "build" key + "success" flag)
    ↓
Routes to foundryParser() or pathbuilderParser()
    ↓
Both output NormalizedCharacter
    ↓
characterStore.addCharacter(normalized)   ← in-memory, instant
    ↓
charactersRepo.save(normalized)           ← IDB, async background write
    ↓
UI re-renders Character Panel from store
```

### Roll Flow (skill check example)

```
User taps skill row in CharacterPanel
    ↓
useRoll hook invoked with SkillEntry
    ↓
[Optional] Check Prompt opens (awaited Promise)
    ├── User sets DC, difficulty adjustments, success step mods
    └── User confirms → CheckPromptResult
    ↓
resolveModifiers(skill.modifiers)
    ├── circumstance bonuses (highest wins)
    ├── status bonuses (highest wins)
    ├── item bonuses (highest wins)
    └── untyped bonuses (all stack)
    ↓
rollDice("1d20+" + resolvedTotal)
    ↓ [if DC provided]
degreeOfSuccess(rollTotal, dc, naturalValue)
    ├── Critical Success: beat DC by 10+ OR natural 20 bumps up
    ├── Success: meet or exceed DC
    ├── Failure: miss DC
    └── Critical Failure: miss DC by 10+ OR natural 1 bumps down
    ↓
rollStore.appendResult({ ... })
    ↓
historyRepo.append(result)    ← IDB async
    ↓
RollResult component animates with result
Roll Log updates
```

### Attack Roll Flow (MAP-aware)

```
User taps weapon in AttackList
    ↓
useRoll hook asks sessionStore for current MAP state
    ↓ (first attack: +0, second: -5/-4 agile, third: -10/-8 agile)
Resolves final attack modifier
    ↓
rollDice("1d20+" + modifier) for attack
    ├── [Hit confirmed] rollDice(damageDice + damageBonus) for damage
    └── [Critical hit] double dice, apply fatal/deadly/etc.
    ↓
sessionStore increments attackCount
    ↓
Results logged
```

### Persistence Hydration Flow (app boot)

```
main.tsx mounts App
    ↓
useHydrate hook fires (runs once)
    ↓
charactersRepo.getAll() → characterStore.hydrate(chars)
historyRepo.getRecent(100) → rollStore.hydrate(recent)
prefsRepo.get() → uiStore.hydrate(prefs)
    ↓
uiStore.setHydrated(true)
    ↓
App renders (conditional on hydrated flag)
```

---

## Component Boundaries (What Talks to What)

| Boundary | Communication Method | Rule |
|----------|---------------------|------|
| UI components → Store | Zustand `useStore()` hook (read) + store actions (write) | Components never call engine functions directly |
| Hooks → Engine | Direct function calls | Hooks are the only orchestrators; components call hooks |
| Store → Persistence | Zustand `subscribeWithSelector` | Store never awaits persistence; fire-and-forget |
| Parsers → Store | Return value only; hook calls `store.addCharacter()` | Parsers are pure; they never write to store |
| Engine → Store | Never directly; results flow through hooks | Engine functions have zero knowledge of React |
| Service Worker → App | Workbox `register()` + update notification event | Service worker is opaque to app logic; app handles update prompt |

---

## Suggested Build Order

Dependencies determine this order. Each phase can only start when its inputs exist.

```
Phase 1: Foundation
├── Vite + React + TypeScript scaffold
├── vite-plugin-pwa configuration (Workbox generateSW)
├── Zustand store setup (all slices, empty)
├── IndexedDB schema via idb (db.ts, repos)
└── CSS theme layer (3 themes as custom properties)

    ↓ [IDB and store exist]

Phase 2: Import Pipeline
├── NormalizedCharacter TypeScript schema (the contract)
├── Foundry parser (against Foundry-Knurvik.json sample)
├── Pathbuilder parser (against Pathbuilder-Kairos.json sample)
├── Format autodetection
└── File import UI + characterStore integration

    ↓ [characters can be loaded into memory]

Phase 3: Core Rules Engine
├── Dice engine (expression parser + crypto PRNG)
├── Modifier resolver (PF2e bonus stacking)
├── Degree-of-success calculator
└── MAP calculator

    ↓ [rules logic is correct and testable]

Phase 4: Roll UI (basic)
├── Character Panel (skills, saves, perception)
├── useRoll hook
├── RollResult display
└── Roll Log (append-only)

    ↓ [core rolling works end-to-end]

Phase 5: Attack + Damage Flow
├── Attack List from NormalizedCharacter.attacks
├── MAP-aware attack roll
├── Damage roll (conditional on hit)
└── Critical hit handling

    ↓ [combat rolls complete]

Phase 6: Spell Rolling
├── Spell List from NormalizedCharacter.spellcasting
├── Spell attack rolls (attack modifier per tradition)
├── Spell DC (class DC calculation)
└── Damage display for spells

    ↓ [spell rolls complete]

Phase 7: Check Prompt + Hero Points
├── CheckPrompt modal component
├── DC types (numeric, simple DC table, level-based)
├── Difficulty adjustment (easier/harder steps)
├── Success step modification
└── Hero point reroll on d20 failure

    ↓ [Foundry-style check prompt complete]

Phase 8: Session Features + GM Mode
├── Session tagging on roll history
├── Export roll history to JSON
├── GM Roster (multi-character switching)
└── Player mode (single character focus)

    ↓ [all features complete]

Phase 9: Polish
├── Three theme refinement
├── Responsive layout (phone / tablet / desktop)
├── Feat manual override system
├── Arbitrary dice picker
└── PWA install prompt handling
```

**Critical dependency:** The `NormalizedCharacter` schema (Phase 2) is the interface contract between parsers and the rest of the system. It must be designed carefully before Phase 3 begins, because the rules engine and UI both depend on its field names and shape. Changing it later cascades through all consumers.

**Can parallelise:** Phase 3 (rules engine) and Phase 2 (parsers) can be built in parallel by different contributors once the `NormalizedCharacter` interface is locked — parsers and engine are independent. Phase 4 UI can start in parallel as soon as Phase 2 output shape is known (mock characters can stub the store).

---

## Anti-Patterns

### Anti-Pattern 1: Parsing Logic in UI Components

**What people do:** Call `json.system.skills.athletics.rank` directly in a React component to render a skill row.

**Why it's wrong:** Couples the UI to the Foundry JSON shape. Changing to Pathbuilder or adding a third format requires touching every component. Impossible to test UI without real import data.

**Do this instead:** Parse to `NormalizedCharacter` at import time. Components only receive `SkillEntry` from the normalised model.

### Anti-Pattern 2: Dice Rolling in Store Actions

**What people do:** Put dice rolling logic inside a Zustand action so it's "centralized."

**Why it's wrong:** Store actions become untestable without store setup. Dice + rules logic is a pure computation concern that must be testable independently.

**Do this instead:** Roll in the engine (`dice.ts`), resolve modifiers in `modifiers.ts`, then dispatch the *result* to the store. Store actions only accept data — they never compute.

### Anti-Pattern 3: Synchronous IndexedDB Writes Blocking UI

**What people do:** `await historyRepo.append(result)` in the roll flow before showing the result to the user.

**Why it's wrong:** IDB writes can take 5-50ms. For a dice roller, delay between button tap and result display destroys the feel.

**Do this instead:** Update Zustand store immediately (synchronous, causes re-render), then fire-and-forget IDB write with `.catch(logError)`. The store is the truth; IDB is the backup.

### Anti-Pattern 4: Skipping the Normalised Schema

**What people do:** Detect `character.source === 'foundry'` everywhere in the rules engine to handle format differences.

**Why it's wrong:** Foundry and Pathbuilder JSON structures are meaningfully different (Foundry stores raw proficiency ranks; Pathbuilder stores pre-computed bonuses; Foundry uses `items[]` array with typed entries; Pathbuilder has a flat `weapons[]` and `mods` map). Without normalization, every rules calculation becomes a forking mess.

**Do this instead:** Both parsers must fully resolve all values into `NormalizedCharacter` at import time. The rules engine assumes it is always talking to normalised data — no source conditionals allowed past the parser boundary.

### Anti-Pattern 5: Storing Paizo Rule Text in the App

**What people do:** Ship a local database of feat descriptions, spell rules text, or trait definitions to auto-parse any feat.

**Why it's wrong:** Violates Paizo's OGL/ORC license terms. Creates massive maintenance burden tracking errata and new releases. The project brief explicitly rules this out.

**Do this instead:** Parse only what is present in the character export JSON (feat names, their mechanical `rules[]` array elements from Foundry). Provide a manual override UI for feats whose effects can't be auto-parsed.

---

## Scaling Considerations

This is a fully client-side PWA. "Scaling" means app performance as character data and roll history grow, not server infrastructure.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-5 characters, 1 session | Current architecture — load everything on boot, no optimisation needed |
| 10+ characters, 50+ sessions | Lazy-load character data from IDB on demand (don't hydrate all chars on boot); paginate roll log |
| 100+ sessions of roll history | Add IDB index on `sessionId` and `timestamp` for efficient filtered queries; virtual scrolling in Roll Log |

### Performance Notes

- Roll history in IDB can grow unbounded. Set a soft cap with a "export and archive" flow rather than auto-pruning.
- Character JSON files (Foundry export) can be large (200-500KB with all item descriptions). Parse synchronously on import but don't re-parse on every boot — store the normalised form in IDB, not the raw JSON.
- CSS custom property theming has near-zero runtime cost. All three themes can be loaded in the same bundle.

---

## Integration Points

### External Formats (Input Only)

| Format | Detection | Notes |
|--------|-----------|-------|
| Foundry VTT PF2e JSON | Root has `"system"` key with `"details.level"` + `"items"` array | Confirmed against Foundry-Knurvik.json; schema version tracked in `_stats.systemVersion` (7.10.1 at time of research) |
| Pathbuilder 2e JSON | Root has `"success": true` and `"build"` object | Confirmed against Pathbuilder-Kairos.json; pre-computes many values (attack bonuses, AC) that Foundry leaves as raw data |

### Key Structural Differences Between Formats

| Data Point | Foundry JSON | Pathbuilder JSON |
|------------|-------------|-----------------|
| Skill values | Raw proficiency rank (0-4) in `system.skills.*` — must calculate modifier from rank × 2 + level + ability | Pre-computed total bonus not present; proficiency level in `build.proficiencies.*` (0=untrained, 2=trained, 4=expert, 6=master, 8=legendary) |
| Attack bonuses | Items array entries with `system.traits`, rune data — must compute from prof + ability + item bonus | Pre-computed in `build.weapons[].attack` |
| Feat data | Full `items[]` entries with `system.rules[]` array (Foundry Rule Elements) — mechanical effects parseable | Feat list in `build.feats[]` with name only — no mechanical data |
| Spell slots | Reconstructed from items array | Explicit in `build.spellCasters[].perDay[]` |
| Temporary mods | Active effects system | `build.mods` flat map (e.g. `{"Arcana": {"Item Bonus": 1}}`) |

---

## Sources

- [Archives of Nethys — Bonuses and Penalties (PF2e RAW)](https://2e.aonprd.com/Rules.aspx?ID=22) — HIGH confidence, official rules source
- [Archives of Nethys — Step 1: Roll d20 and Identify Modifiers](https://2e.aonprd.com/Rules.aspx?ID=315) — HIGH confidence
- [Foundry VTT PF2e Wiki — Quickstart guide for rule elements](https://github.com/foundryvtt/pf2e/wiki/Quickstart-guide-for-rule-elements) — HIGH confidence, official system repo
- [vite-plugin-pwa — Service Worker Precache](https://vite-pwa-org.netlify.app/guide/service-worker-precache) — HIGH confidence, official plugin docs
- [Workbox via web.dev](https://web.dev/learn/pwa/workbox) — HIGH confidence, Google official
- [PWA Architecture — web.dev](https://web.dev/learn/pwa/architecture) — HIGH confidence
- [Making totally offline-available PWAs with Vite and React](https://adueck.github.io/blog/caching-everything-for-totally-offline-pwa-vite-react/) — MEDIUM confidence, verified against official docs
- Foundry-Knurvik.json and Pathbuilder-Kairos.json — actual sample files in repository, examined directly — HIGH confidence for schema details

---

*Architecture research for: Client-side PF2e Dice Roller PWA*
*Researched: 2026-03-14*
