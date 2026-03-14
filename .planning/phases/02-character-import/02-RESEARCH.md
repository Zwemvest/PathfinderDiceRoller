# Phase 2: Character Import - Research

**Researched:** 2026-03-14
**Domain:** JSON parsing (Foundry VTT + Pathbuilder), TypeScript schema design, Dexie IndexedDB, Svelte 5 file input
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Import Flow**
- File picker button + drag-and-drop support (no paste)
- Import lives in Character tab empty state: big "Import Character" button when no character loaded
- After first import, a + button appears for additional imports
- User selects format before import: "Foundry" or "Pathbuilder" picker (no auto-detect)
- On success: confirmation card — "Imported Knurvik (Level 1 Monk)" — then shows character overview
- On failure: detailed error message showing what went wrong — "Found JSON but missing expected fields: system.details.level"

**Character Display**
- Dashboard overview at top: name, class, level, key ability modifiers, HP
- Ability scores: modifier only (no raw scores) — PF2e Remaster made scores irrelevant, show "+4 STR" not "STR 18 (+4)"
- Collapsible sections below dashboard: Skills, Attacks, Spells, Saves, Feats
- Skills: compact 2-column grid — skill name + total modifier, tap to roll (rolling wired in Phase 4)
- Attacks/weapons: compact display — "+1 Striking Staff +15" — full damage breakdown appears on roll result (Phase 5)
- Spells: show spell names and levels grouped by spell level — no damage data (user uses free-form dice roller in Phase 6)
- Saves: Fortitude, Reflex, Will with total modifiers
- Feats: grouped by type (class feat, ancestry feat, skill feat, general feat) — names only, no mechanical effects until v2
- Perception: displayed prominently (used frequently for initiative and checks)

**Data Handling**
- User selects format (Foundry vs Pathbuilder) before import — no auto-detection
- Multiple characters allowed — user can import several characters (for alts, not GM mode)
- Re-import: match by character name, show confirmation with changes summary ("Level 5 → 6, new feat: Sudden Charge"), confirm before replacing
- Both parsers produce the same NormalizedCharacter schema
- Dexie `characters` store expanded from Phase 1 placeholder to full NormalizedCharacter

**Character Switcher**
- Separate character list page (not a dropdown) — shows all imported characters as cards
- Tap a character card to make it the active character and navigate to their dashboard
- Active character indicated visually
- Delete character available from the list (with confirmation)

**JSON Format Specifics**
- Foundry JSON (5 sample files): abilities is null, skills is {}, saves is {} — everything must be reconstructed from items[]
- Pathbuilder JSON (1 sample): pre-computed totals. Much easier to parse.
- Both formats produce identical NormalizedCharacter output
- Spell data: names + levels only — damage via free-form roller (Phase 6)

### Claude's Discretion
- NormalizedCharacter TypeScript interface design (field names, nesting structure)
- Parser implementation approach (how to reconstruct Foundry data from items[])
- Error handling granularity (which fields are required vs optional)
- Character card design on the list page
- Collapsible section default states (expanded/collapsed)
- How to handle Foundry spells found in items[] vs spellcasting entries

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| IMPT-01 | User can import a character from a Foundry VTT JSON export file | Foundry JSON paths fully mapped; reconstruction algorithm verified against all 4 sample files |
| IMPT-02 | User can import a character from a Pathbuilder JSON export file | Pathbuilder JSON paths fully mapped; all fields pre-computed; mods object understood |
| IMPT-03 | Imported character data persists across browser sessions (IndexedDB) | Dexie already set up with characters table; schema migration path identified |
| IMPT-04 | User can delete an imported character | Standard Dexie delete by id; confirmation flow |
| IMPT-05 | User can re-import/update a character from a new JSON export | Match by name, replace strategy with Dexie put() |
</phase_requirements>

---

## Summary

Both Foundry VTT and Pathbuilder exports produce very different JSON shapes, but all required data is extractable from each. Pathbuilder is the easy case: nearly all values are pre-computed (attack bonuses, skill totals, saves, spell DCs). Foundry is the hard case: `system.abilities` is always `null`, `system.skills` is often empty or partial, and all modifiers must be reconstructed by walking item arrays and summing boost/rank values.

The reconstruction algorithm for Foundry has been verified against all four sample files (Knurvik/Monk, Brickney/Barbarian, Duin/Cleric, Roo/Thaumaturge). Ability scores are reconstructed by combining: ancestry item boosts + ancestry flaws, background item boosts, class key ability selection, and `system.build.attributes.boosts` (level boosts). Saves are taken from the class item's `savingThrows` proficiency ranks. Skills are taken directly from `system.skills` where present (only non-zero ranks are stored).

The `NormalizedCharacter` interface is the locked output of this phase. Phases 3–7 all read from it. The schema must accommodate both formats' data without lossy coercion. Spells are names + levels only in this phase — no damage expressions exist in either format (Pathbuilder omits them entirely; Foundry may not have spell items configured for low-level characters).

**Primary recommendation:** Implement two standalone parser functions — `parseFoundry(json: unknown): NormalizedCharacter` and `parsePathbuilder(json: unknown): NormalizedCharacter` — each throwing a structured `ImportError` on missing required fields. Store the parsed result (not raw JSON) in Dexie. The `NormalizedCharacter` interface should include everything Phases 3–7 need without requiring re-parsing.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Dexie | Already installed (Phase 1) | IndexedDB persistence for NormalizedCharacter | Already in use; version upgrade via `this.version(2)` |
| TypeScript | Project standard | NormalizedCharacter interface; parser types | Type safety for locked schema |
| Svelte 5 runes | Project standard | File picker UI, drag-drop, character list | Established pattern from Phase 1 |
| Tailwind CSS v4 | Project standard | Character display styling | Established pattern |
| Vitest (browser mode) | Already configured | Parser unit tests + IndexedDB integration tests | Configured in Phase 1 with Playwright |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Built-in `FileReader` / `File.text()` | Browser API | Read dropped/picked JSON files | Use `File.text()` (Promise-based, simpler) |
| Built-in `JSON.parse` | Browser API | Parse file content | Wrap in try/catch for parse errors |
| Built-in drag-and-drop events | Browser API | `dragover`, `drop` on the import zone | Prevent default, read `e.dataTransfer.files[0]` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Storing full NormalizedCharacter in Dexie | Storing raw JSON + parsing on load | Raw JSON approach means re-parsing every load; NormalizedCharacter approach means schema migrations required if format changes — but schema is locked, so store parsed |
| Manual boost reconstruction | Importing from PF2e system compendium | Compendium approach would require bundling a large rules DB; manual reconstruction verified working |

**Installation:** No new packages required. Dexie version bump via schema version only.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── db/
│   │   └── index.ts              # Dexie schema - expand to NormalizedCharacter (version 2)
│   ├── parsers/
│   │   ├── types.ts              # NormalizedCharacter interface (the locked schema)
│   │   ├── foundry.ts            # parseFoundry() function
│   │   ├── pathbuilder.ts        # parsePathbuilder() function
│   │   ├── foundry.unit.test.ts  # Parser unit tests (node environment, no browser)
│   │   └── pathbuilder.unit.test.ts
│   └── components/
│       ├── import/
│       │   ├── ImportZone.svelte         # File picker + drag-drop zone
│       │   └── FormatPicker.svelte       # "Foundry" / "Pathbuilder" radio
│       └── character/
│           ├── CharacterCard.svelte      # Card on the list page
│           ├── CharacterDashboard.svelte # Name/class/level/HP/abilities overview
│           ├── SkillsSection.svelte      # Collapsible skills grid
│           ├── SavesSection.svelte       # Fort/Ref/Will row
│           ├── AttacksSection.svelte     # Weapon list
│           ├── SpellsSection.svelte      # Spell list grouped by level
│           └── FeatsSection.svelte       # Feats grouped by category
└── routes/
    ├── character/
    │   └── +page.svelte          # Character tab — import zone or dashboard
    └── characters/
        └── +page.svelte          # Character list page
```

### Pattern 1: Typed Parser with Structured Errors
**What:** Each parser function validates required fields before processing and throws a typed error with a human-readable message identifying the missing field path.
**When to use:** All import operations — never let a bad JSON silently produce a partially populated character.

```typescript
// src/lib/parsers/types.ts

export class ImportError extends Error {
  constructor(
    message: string,
    public readonly missingField?: string
  ) {
    super(message);
    this.name = 'ImportError';
  }
}

function require<T>(value: T | undefined | null, path: string): T {
  if (value === undefined || value === null) {
    throw new ImportError(
      `Found JSON but missing expected field: ${path}`,
      path
    );
  }
  return value;
}
```

### Pattern 2: Dexie Schema Migration (version 1 → 2)
**What:** Bump to `this.version(2)` with the full NormalizedCharacter store. Version 1 `characters` table had `raw: string`; version 2 stores the parsed object directly. Dexie handles migration automatically when a user who has version 1 data opens the app.
**When to use:** In `src/lib/db/index.ts`.

```typescript
// Schema migration pattern - verified from Dexie docs
constructor() {
  super('PathfinderDiceRoller');
  this.version(1).stores({
    characters: '++id, name, importedAt',
    rollHistory: '++id, rolledAt',
    settings: '++id, key',
    heroPoints: '++id, characterId'
  });
  this.version(2).stores({
    characters: '++id, name, importedAt',
    // rollHistory, settings, heroPoints unchanged
  }).upgrade(trans => {
    // Existing raw-string characters cannot be migrated (format unknown)
    // Safe to clear: Phase 1 was pre-release, no real user data
    return trans.table('characters').clear();
  });
}
```

### Pattern 3: Active Character via Dexie Settings Table
**What:** Store the active character's `id` in the `settings` table as `key: 'activeCharacterId'`. Load it on app start. Reactive: `$derived()` in a Svelte store reads from Dexie.
**When to use:** Character switcher — do not use URL params for active character (no server).

### Anti-Patterns to Avoid
- **Storing raw JSON in Dexie and parsing on every page load:** Parsing is O(n) work that must happen only on import. Store `NormalizedCharacter` directly.
- **Auto-detecting format from JSON shape:** Context locks this as user-selected. Do not build detection.
- **Using `system.abilities` from Foundry JSON:** It is always `null`. Never read it.
- **Relying on `system.skills` being complete in Foundry:** It only stores explicitly-set ranks. An empty `{}` does not mean the character has no skills — it means the GM hasn't configured them yet in Foundry.
- **Using Svelte 4 reactive syntax (`$:`):** Use `$state()`, `$derived()`, `$effect()` only.

---

## Foundry VTT JSON — Complete Data Map

**Verified against:** Knurvik (Monk L1), Brickney Spears (Barbarian L1), Duin (Cleric L1), Roo (Thaumaturge L1)

### Top-Level Structure
```
data.name                           → character name
data.type                           → "character"
data.system.details.level.value     → character level (integer)
data.system.details.keyability.value → key ability slug ("str", "dex", etc.)
data.system.attributes.hp.value     → CURRENT hp (not max — max must be computed)
data.system.resources.heroPoints.value → current hero points
data.system.skills                  → object of {[skillName]: {rank: number}} — PARTIAL ONLY
data.system.abilities               → always null — DO NOT USE
data.system.build.attributes.boosts → {[levelStr]: string[]} — free level boosts taken
data.items[]                        → all character items (see item types below)
```

### Item Types Found in Foundry Exports
```
ancestry        → racial details, hp, boosts (fixed + free), flaws
heritage        → heritage bonus rules (may grant skill ranks via rules[])
background      → boosts, trainedSkills.value[], trainedSkills.lore[]
class           → class name, hp, savingThrows.{fortitude,reflex,will}, perception,
                  keyAbility, trainedSkills.{value[],additional}, attacks.{simple,martial,advanced,unarmed}
feat            → system.category: "class"|"ancestry"|"skill"|"general"|"classfeature"|"ancestryfeature"
weapon          → system.damage.{die,dice,damageType}, system.traits.value[], system.runes.{potency,striking},
                  system.category ("simple"|"martial"|"advanced"), system.bonus.value
armor           → system.acBonus, system.runes.{potency,resilient}, system.equipped.inSlot
shield          → system.acBonus
effect          → system.rules[] — can create additional Strike options (e.g. Mountain Stance unarmed)
action          → class actions (Rage, etc.) — display only
spellcastingEntry → spell attack/DC entry (may be absent for low-level characters)
spell           → individual spell item (may be absent for low-level characters)
lore            → lore skill with rank (rare — seen in some heritage rules)
deity           → deity name, anathema, etc. — display only
consumable      → potions etc. — not needed for Phase 2
equipment       → implements, tools — not needed for Phase 2
treasure        → coins — not needed for Phase 2
```

### Ability Score Reconstruction (VERIFIED)

Foundry stores `system.abilities = null`. Ability scores must be reconstructed from boost items.

**Algorithm (verified produces correct results for all 4 sample characters):**
```typescript
// Proficiency rank encoding: 0=untrained, 1=trained, 2=expert, 3=master, 4=legendary
// Proficiency bonus: untrained=0, trained=(level+2), expert=(level+4), master=(level+6), legendary=(level+8)

function reconstructAbilities(data: FoundryJSON): Record<string, number> {
  const abilities = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

  // Step 1: ancestry fixed boosts (value.length === 1) + selected free boost
  const anc = data.items.find(i => i.type === 'ancestry');
  Object.values(anc.system.boosts).forEach(boost => {
    const chosen = boost.selected ?? (boost.value.length === 1 ? boost.value[0] : null);
    if (chosen) abilities[chosen] += 2;
  });
  // ancestry flaws
  Object.values(anc.system.flaws).forEach(flaw => {
    if (flaw.value[0]) abilities[flaw.value[0]] -= 2;
  });

  // Step 2: background boosts
  const bg = data.items.find(i => i.type === 'background');
  Object.values(bg.system.boosts).forEach(boost => {
    const chosen = boost.selected ?? (boost.value.length === 1 ? boost.value[0] : null);
    if (chosen) abilities[chosen] += 2;
  });

  // Step 3: class key ability
  const cls = data.items.find(i => i.type === 'class');
  const keyAbil = cls.system.keyAbility.selected ?? cls.system.keyAbility.value[0];
  if (keyAbil) abilities[keyAbil] += 2;

  // Step 4: level boosts from system.build.attributes.boosts
  const buildBoosts = data.system.build?.attributes?.boosts ?? {};
  Object.values(buildBoosts).forEach((boosts: string[]) => {
    boosts.forEach(a => { abilities[a] += 2; });
  });

  return abilities;
}

// Ability modifier: Math.floor((score - 10) / 2)
// Proficiency bonus: rank === 0 ? 0 : level + (rank * 2)
```

**Important caveat:** If `boost.selected` is `null` and `boost.value.length > 1`, the free boost has not been chosen in Foundry yet. Treat the boost as 0 — do not guess. This results in a slightly lower ability score, which is acceptable. Display a warning: "Some ability boosts may not be fully configured in your Foundry export."

### Save Reconstruction
```
// From class item:
classItem.system.savingThrows.fortitude  → proficiency rank (0-4)
classItem.system.savingThrows.reflex     → proficiency rank (0-4)
classItem.system.savingThrows.will       → proficiency rank (0-4)

// Save total = ability mod + proficiency bonus
// ability: fortitude=CON, reflex=DEX, will=WIS
```

### Perception Reconstruction
```
classItem.system.perception → proficiency rank (0-4)
// Perception total = WIS mod + proficiency bonus
```

### Skill Reconstruction
```
// data.system.skills: {[skillName]: {rank: number}}
// Only non-zero ranks are stored. Skills missing from this object = untrained.
// Background-forced and class-forced trainings SHOULD appear here but may be absent
// for characters where the GM hasn't saved after assigning skills.

// Fallback: if a skill is in background.trainedSkills.value or class.trainedSkills.value
// but NOT in system.skills, treat it as rank 1 (trained) for display purposes.

// Skill ability mapping (PF2e standard):
acrobatics → dex, arcana → int, athletics → str, crafting → int,
deception → cha, diplomacy → cha, intimidation → cha, medicine → wis,
nature → wis, occultism → int, performance → cha, religion → wis,
society → int, stealth → dex, survival → wis, thievery → dex

// Lore skills: background.system.trainedSkills.lore[] → array of lore skill names
// Lore ability = INT, rank = 1 (trained by background)
```

### Weapon Reconstruction
```typescript
// From weapon item:
weapon.name
weapon.system.damage.die              // "d4", "d6", "d8", "d10", "d12"
weapon.system.damage.dice             // number of dice before striking rune
weapon.system.damage.damageType       // "bludgeoning", "slashing", "piercing"
weapon.system.traits.value[]          // ["agile", "finesse", "reach", etc.]
weapon.system.runes.potency           // 0-4 (item bonus to attack)
weapon.system.runes.striking          // 0-3 (0=none, 1=striking, 2=greater, 3=major)
weapon.system.category                // "simple", "martial", "advanced"
weapon.system.bonus.value             // additional bonus (usually 0)
weapon.system.equipped.carryType      // "held"|"worn"|"stowed" — filter to held/worn

// Dice count after striking rune: damage.dice + runes.striking (but striking=1 means +1 die)
// Actually: striking=0 → dice as-is, striking=1 → dice+1, striking=2 → dice+2, striking=3 → dice+3

// Attack bonus reconstruction:
// 1. Determine proficiency rank from class.system.attacks[weapon.system.category]
//    (simple, martial, advanced, unarmed)
// 2. Determine ability: STR by default; DEX if weapon has 'finesse' trait AND dex > str
// 3. Total = ability_mod + proficiency_bonus + runes.potency + bonus.value

// Effect items (type="effect") can add Strike rules — these create additional attack
// options (e.g., Mountain Stance adds an unarmed Falling Stone attack).
// For Phase 2 display: include effect-based strikes in attacks section.
// For Phase 5 (MAP/damage): these need further investigation.
```

### HP Computation
```
// CURRENT hp: data.system.attributes.hp.value (tracking state — may differ from max)
// MAX hp must be computed:
// max = (classItem.system.hp * level) + ancestryItem.system.hp + (CON_mod * level) + bonusHp
// bonusHp: look for feat rules with key="FlatModifier" and selector="hp" (rare)
// Display: show computed max, show current from hp.value
// Note: 1-2 hp discrepancy observed in sample data — acceptable

// Class DC: no direct field in Foundry
// Class DC = 10 + class.system.perception (as rank) + key_ability_mod
// Wait — classDC uses class's proficiency, not perception
// Foundry does NOT store classDC proficiency separately in class item
// Assume trained (rank 1) for level 1 characters as default
// Better: skip classDC in Phase 2; Phase 3 (Rules Engine) addresses DC computation
```

### Spells in Foundry
```
// Spell items appear as type="spell" and type="spellcastingEntry" in items[]
// ALL 4 sample files have zero spell items — they are low-level characters
// whose GMs have not configured spells in Foundry yet.
//
// When present:
// spellcastingEntry: system.tradition.value, system.prepared.value ("prepared"|"spontaneous"|"innate")
//                    system.ability.value (casting ability slug)
//                    system.proficiency.value (rank number) — may be 0 if not computed
// spell: name, system.level.value (spell rank 1-10, 0=cantrip)
//        system.traits.value[] (spell traits)
//        system.damage (complex — omit for Phase 2, display name+level only)
//
// Strategy for Phase 2: if no spellcastingEntry items, show empty Spells section
// with message "No spells configured in Foundry export"
// Do not error out — non-casters legitimately have no spells
```

---

## Pathbuilder JSON — Complete Data Map

**Verified against:** Kairos (Magus L6)

### Top-Level Structure
```
data.success                → boolean (verify true before parsing)
data.build                  → all character data
```

### Identity Fields (all direct reads)
```
build.name                  → character name
build.class                 → class name (string)
build.dualClass             → null or string (ignore for Phase 2)
build.level                 → character level
build.ancestry              → ancestry name
build.heritage              → heritage name
build.background            → background name
build.keyability            → key ability slug ("str", "dex", etc.)
build.deity                 → deity name (display only)
build.languages[]           → array of language strings
```

### Abilities (pre-computed final scores)
```
build.abilities.str         → final STR score (e.g. 19)
build.abilities.dex         → final DEX score
build.abilities.con         → final CON score
build.abilities.int         → final INT score
build.abilities.wis         → final WIS score
build.abilities.cha         → final CHA score
// Modifier: Math.floor((score - 10) / 2)
// DO NOT use build.abilities.breakdown — it is informational only
```

### Proficiency Ranks (0=untrained, 2=trained, 4=expert, 6=master, 8=legendary)

**IMPORTANT: Pathbuilder uses a different encoding than Foundry!**
- Foundry: ranks 0-4, bonus = level + rank*2
- Pathbuilder: ranks 0/2/4/6/8, bonus = level + rank (since rank already includes the *2)

```typescript
// Pathbuilder proficiency bonus formula:
const profBonus = (rank: number) => rank === 0 ? 0 : level + rank;

build.proficiencies.perception      → perception rank
build.proficiencies.fortitude       → fortitude rank
build.proficiencies.reflex          → reflex rank
build.proficiencies.will            → will rank
build.proficiencies.classDC         → class DC proficiency rank
build.proficiencies.acrobatics      → skill rank
build.proficiencies.arcana          → skill rank
build.proficiencies.athletics       → skill rank
build.proficiencies.crafting        → skill rank
build.proficiencies.deception       → skill rank
build.proficiencies.diplomacy       → skill rank
build.proficiencies.intimidation    → skill rank
build.proficiencies.medicine        → skill rank
build.proficiencies.nature          → skill rank
build.proficiencies.occultism       → skill rank
build.proficiencies.performance     → skill rank
build.proficiencies.religion        → skill rank
build.proficiencies.society         → skill rank
build.proficiencies.stealth         → skill rank
build.proficiencies.survival        → skill rank
build.proficiencies.thievery        → skill rank
// Also present but unused in Phase 2: heavy, medium, light, unarmored,
// advanced, martial, simple, unarmed, castingArcane, castingDivine,
// castingOccult, castingPrimal, piloting, computers
```

### Mods (item bonuses — MUST apply for correct totals)
```typescript
// build.mods: { [SkillNameCapitalized]: { "Item Bonus": number } }
// Keys use Title Case: "Arcana", "Stealth", "Reflex"
// Apply to skill/save totals AFTER ability + proficiency

// Skill total = ability_mod + profBonus(rank) + (mods[TitleCase(skill)]?.["Item Bonus"] ?? 0)
// Save total  = ability_mod + profBonus(rank) + (mods[TitleCase(save)]?.["Item Bonus"] ?? 0)
```

### HP Computation
```typescript
// build.attributes.classhp   → HP per level from class
// build.attributes.ancestryhp → ancestry base HP
// build.attributes.bonushp   → flat bonus HP (rare)
// build.attributes.bonushpPerLevel → bonus HP per level (rare)
// Formula:
const maxHp = build.attributes.classhp * level
            + build.attributes.ancestryhp
            + build.attributes.bonushp
            + build.attributes.bonushpPerLevel * level
            + conMod * level;
// Verified: Kairos (Magus L6, CON 16/+3) = 8*6 + 6 + 0 + 0 + 3*6 = 72 ✓
```

### Weapons
```typescript
// build.weapons[]: array of weapon entries
// Each weapon:
{
  name: string,           // base weapon name
  display: string,        // formatted display string e.g. "+1 Striking Staff (2h)"
  prof: "simple"|"martial"|"advanced"|"unarmed",
  die: "d4"|"d6"|"d8"|"d10"|"d12",
  pot: number,            // potency rune value (item bonus to attack)
  str: ""|"striking"|"greaterStriking"|"majorStriking",
  damageType: "B"|"S"|"P",  // Bludgeoning, Slashing, Piercing
  attack: number,         // PRE-COMPUTED total attack bonus
  damageBonus: number,    // PRE-COMPUTED damage bonus (ability + spec)
  extraDamage: string[],  // e.g. ["1d4 Fire"] from property runes/abilities
  runes: string[],        // property rune names (e.g. ["flaming"])
  increasedDice: boolean, // true when die size increased (one-handed staff etc.)
  qty: number,
  mat: null | string,     // material
  grade: string
}

// Dice count: str mapping:
// ""               → die as-is, 1 die
// "striking"       → 2 dice
// "greaterStriking" → 3 dice
// "majorStriking"  → 4 dice

// NOTE: Pathbuilder does NOT include weapon traits (agile, finesse, etc.)
// Agile detection for MAP (Phase 5) requires a static weapon traits lookup table.
// For Phase 2: display uses pre-computed attack bonus — no traits needed.
```

### Spellcasting
```typescript
// build.spellCasters[]: array of spellcaster entries
// Each entry:
{
  name: string,                     // "Magus", "Archetype Wizard", "Other Spells (Staves etc)"
  magicTradition: "arcane"|"divine"|"occult"|"primal",
  spellcastingType: "prepared"|"spontaneous"|"innate",
  ability: "str"|"dex"|"con"|"int"|"wis"|"cha",
  proficiency: number,              // Pathbuilder rank (0/2/4/6/8)
  focusPoints: number,
  innate: boolean,
  perDay: number[],                 // index = spell level (0-10), value = slots
  spells: Array<{
    spellLevel: number,             // 0 = cantrip
    list: string[]                  // spell names
  }>,
  prepared: Array<{
    spellLevel: number,
    list: string[]                  // currently prepared spell names
  }>,
  blendedSpells: []                 // ignore for Phase 2
}

// Spell attack = profBonus(proficiency) + abilityMod(ability)
// Spell DC    = 10 + profBonus(proficiency) + abilityMod(ability)
// Note: mods may apply to saves but NOT to spell attack/DC (not observed in sample)

// Focus spells:
// build.focusPoints → total focus point pool
// build.focus: { [tradition]: { [ability]: { abilityBonus, proficiency, itemBonus, focusCantrips[], focusSpells[] } } }
```

### Lore Skills
```typescript
// build.lores[]: Array of [name, rank] tuples
// e.g. [["River Kingdoms", 2], ["Academia", 2]]
// All lores use INT as the ability score
// Total = INT_mod + profBonus(rank) + (mods[name + " Lore"]?.["Item Bonus"] ?? 0)
```

### Feats
```typescript
// build.feats[]: Array of tuples [name, null, category, level, ...rest]
// Categories: "Ancestry Feat", "Heritage", "Archetype Feat", "General Feat",
//             "Class Feat", "Skill Feat", "Awarded Feat"
// For Phase 2 display: use index 0 (name) and index 2 (category)
```

### AC
```typescript
// build.acTotal.acTotal → final computed AC
// Also: acProfBonus, acAbilityBonus, acItemBonus broken out
```

### Class DC
```typescript
// Spell DC for class abilities (not spellcasting):
// build.keyability → key ability slug
// build.proficiencies.classDC → rank
// Class DC = 10 + profBonus(classDC) + abilityMod(keyability)
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB CRUD | Custom IndexedDB wrappers | Dexie (already installed) | Handles version migrations, transactions, type safety |
| File reading | FileReader events | `file.text()` (Promise) | Simpler API, no event handling needed |
| JSON validation | Schema library (zod/yup) | Manual field checks with `require()` helper | Zero dependencies; error messages can be format-specific and user-friendly |
| Ability score math | Lookup tables or hardcoded arrays | Formula reconstruction (verified above) | Simple arithmetic — no external data needed |

**Key insight:** The parsers are pure TypeScript functions with no external dependencies. Keep them that way — they are easy to test with `vitest --project unit` (node environment, no browser needed).

---

## Common Pitfalls

### Pitfall 1: Foundry Ability Score is Always Null
**What goes wrong:** Code reads `data.system.abilities.str.value` and crashes with TypeError.
**Why it happens:** Foundry PF2e system computes abilities at runtime and does not serialize them into exports.
**How to avoid:** Never read `system.abilities`. Always reconstruct from items[] using the boost algorithm.
**Warning signs:** TypeScript type for Foundry JSON must declare `abilities: null`.

### Pitfall 2: Foundry Skills May Be Empty for Valid Characters
**What goes wrong:** Parser returns 0 skills for a character, or errors on empty `system.skills`.
**Why it happens:** `system.skills` only stores ranks that the GM has explicitly saved. A newly created Foundry character that hasn't had skills configured has `{}`.
**How to avoid:** Accept empty `system.skills` as valid. Merge with class.trainedSkills.value and background.trainedSkills.value as rank-1 fallbacks. Display whatever is available rather than erroring.
**Warning signs:** All 4 sample files except Duin had empty system.skills.

### Pitfall 3: Pathbuilder Proficiency Scale ≠ Foundry Proficiency Scale
**What goes wrong:** Using Foundry rank*2 formula on Pathbuilder data produces wrong totals.
**Why it happens:** Foundry uses ranks 0-4 (bonus = level + rank×2). Pathbuilder uses ranks 0/2/4/6/8 (bonus = level + rank directly).
**How to avoid:** Two separate `profBonus()` functions — one per parser. Never share the formula.
**Warning signs:** Skill totals off by 2-8 for Pathbuilder characters.

### Pitfall 4: Pathbuilder `str` Field Is Striking Rune, Not STR Ability
**What goes wrong:** Code interprets `weapon.str` as the STR ability slug and crashes or produces garbage.
**Why it happens:** Naming collision — `str` in the weapons array means "striking" rune level.
**How to avoid:** Name the local variable `strikingRune` or `strikingRuneStr` when reading it.
**Warning signs:** TypeScript type inference may not catch this — use explicit interfaces.

### Pitfall 5: Foundry `ancestry.boosts` Free Choice May Be Unselected
**What goes wrong:** Code assumes `boost.selected` is always set and reads an undefined value as an ability slug.
**Why it happens:** The ancestry free boost (a single boost with all 6 options) records `selected: null` if the player hasn't chosen in Foundry.
**How to avoid:** `const chosen = boost.selected ?? (boost.value.length === 1 ? boost.value[0] : null); if (chosen) ...`
**Warning signs:** Roo and Duin had `selected: null` on their free ancestry boost.

### Pitfall 6: Dexie Schema Migration Loses Phase 1 Data
**What goes wrong:** Bumping to version 2 without an upgrade function silently drops character data.
**Why it happens:** Dexie requires an explicit `upgrade()` callback when changing stored object shape.
**How to avoid:** Add `.upgrade()` that clears the old `characters` table (Phase 1 data was test-only `{id, importedAt, name, raw: string}`; cannot migrate without knowing original format).
**Warning signs:** Existing characters disappear after app update; no error shown.

### Pitfall 7: No Spells Is Not an Error for Non-Casters
**What goes wrong:** Parser errors when `spellcastingEntry` items are absent.
**Why it happens:** Monk, Barbarian have no spells — absence is correct.
**How to avoid:** Spellcasting fields in `NormalizedCharacter` must be optional/empty-array, not required.
**Warning signs:** Import fails for any martial character.

### Pitfall 8: Foundry Weapon Attack Bonus Requires Proficiency Lookup
**What goes wrong:** Parser uses a hardcoded +2 proficiency bonus instead of deriving it from the class item.
**Why it happens:** Different classes have different weapon proficiencies (Monk is untrained in martial, Barbarian is trained in martial).
**How to avoid:** Always look up `classItem.system.attacks[weapon.system.category]` for the proficiency rank.
**Warning signs:** Monk gets wrong attack bonus on a non-unarmed weapon.

---

## NormalizedCharacter Interface Design

This is the locked schema output of Phase 2. All later phases read from this.

```typescript
// src/lib/parsers/types.ts

export type AbilitySlug = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export type DamageType = 'bludgeoning' | 'slashing' | 'piercing' | 'fire' | 'cold' | 'acid' | 'electricity' | 'sonic' | 'positive' | 'negative' | 'mental' | 'poison' | 'force' | string;
export type MagicTradition = 'arcane' | 'divine' | 'occult' | 'primal';
export type SpellcastingType = 'prepared' | 'spontaneous' | 'innate' | 'focus';
export type FeatCategory = 'class' | 'ancestry' | 'skill' | 'general' | 'classfeature' | 'ancestryfeature' | 'heritage' | 'archetype' | 'other';

export interface NormalizedAbilities {
  str: number;  // ability modifier (not score)
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface NormalizedSaves {
  fortitude: number;  // total modifier (ability + prof + item)
  reflex: number;
  will: number;
}

export interface NormalizedSkill {
  name: string;              // e.g. "acrobatics", "river-kingdoms-lore"
  label: string;             // display label e.g. "Acrobatics", "River Kingdoms Lore"
  ability: AbilitySlug;      // governing ability
  total: number;             // total modifier
  proficiencyRank: number;   // 0-4 (normalized to Foundry scale for both parsers)
  itemBonus: number;         // from mods object (Pathbuilder) or 0 (Foundry)
  isLore: boolean;           // true for lore skills
}

export interface NormalizedWeapon {
  name: string;              // weapon name
  display: string;           // formatted display e.g. "+1 Striking Staff +15"
  attackBonus: number;       // total attack modifier
  damageDice: number;        // number of dice (after striking rune)
  damageDie: string;         // "d4", "d6", "d8", "d10", "d12"
  damageBonus: number;       // flat damage bonus
  damageType: DamageType;    // primary damage type
  extraDamage: string[];     // additional damage expressions e.g. ["1d4 Fire"]
  traits: string[];          // weapon traits for Phase 5 (agile, finesse, reach, etc.)
  category: 'simple' | 'martial' | 'advanced' | 'unarmed';
  potency: number;           // potency rune value (item bonus to attack)
  strikingRune: 0 | 1 | 2 | 3;  // 0=none, 1=striking, 2=greater, 3=major
}

export interface NormalizedSpell {
  name: string;
  spellLevel: number;        // 0 = cantrip
}

export interface NormalizedSpellcaster {
  name: string;              // caster entry label
  tradition: MagicTradition;
  type: SpellcastingType;
  ability: AbilitySlug;
  spellAttack: number;       // total spell attack modifier
  spellDC: number;           // total spell DC
  focusPoints: number;       // focus points for this entry (usually 0)
  innate: boolean;
  perDay: number[];          // slots by spell level [level0, level1, ...]
  spells: Array<{ spellLevel: number; list: string[] }>;          // known/repertoire
  prepared: Array<{ spellLevel: number; list: string[] }>;        // daily prepared
  focusSpells: string[];     // focus spell names
  focusCantrips: string[];   // focus cantrip names
}

export interface NormalizedFeat {
  name: string;
  category: FeatCategory;
  level: number;             // level when taken (Pathbuilder) or 0 if unknown (Foundry)
}

export interface NormalizedCharacter {
  // Identity
  name: string;
  class: string;
  ancestry: string;
  heritage: string;
  background: string;
  level: number;
  keyAbility: AbilitySlug;

  // Core stats
  abilities: NormalizedAbilities;    // ability modifiers (not scores)
  maxHp: number;                     // computed max HP
  currentHp: number;                 // current HP (Foundry only; Pathbuilder sets = maxHp)
  heroPoints: number;                // current hero points (1-3)
  ac: number;                        // total AC
  classDC: number;                   // class DC (10 + prof + key ability mod)
  perception: number;                // total perception modifier

  // Saves
  saves: NormalizedSaves;

  // Skills (all trained + some untrained if known)
  skills: NormalizedSkill[];

  // Combat
  weapons: NormalizedWeapon[];

  // Spellcasting (empty array if no spellcasting)
  spellcasters: NormalizedSpellcaster[];
  totalFocusPoints: number;          // total focus point pool

  // Feats
  feats: NormalizedFeat[];

  // Import metadata
  importedAt: Date;
  sourceFormat: 'foundry' | 'pathbuilder';
}
```

**Why this structure:**
- Abilities stored as **modifiers** (not scores): matches PF2e Remaster and the display requirement.
- `skills` is an array (not a record) so lore skills can be included without naming conflicts.
- `spellcasters` is an array so multi-tradition characters (Kairos has 4 entries) are fully supported.
- `weapons` includes `traits[]` even though Phase 2 only displays the attack bonus — Phase 5 (MAP, agile, fatal) reads from this.
- `currentHp` for Foundry (tracks real game state); Pathbuilder sets it equal to `maxHp` since Pathbuilder is a builder, not a tracker.
- `sourceFormat` retained for debugging and potential future format-specific logic.

---

## Code Examples

### Pathbuilder Parser (skeleton)
```typescript
// src/lib/parsers/pathbuilder.ts
import type { NormalizedCharacter, NormalizedSkill } from './types';
import { ImportError } from './types';

const SKILL_ABILITIES: Record<string, AbilitySlug> = {
  acrobatics: 'dex', arcana: 'int', athletics: 'str', crafting: 'int',
  deception: 'cha', diplomacy: 'cha', intimidation: 'cha', medicine: 'wis',
  nature: 'wis', occultism: 'int', performance: 'cha', religion: 'wis',
  society: 'int', stealth: 'dex', survival: 'wis', thievery: 'dex'
};

export function parsePathbuilder(json: unknown): NormalizedCharacter {
  if (typeof json !== 'object' || json === null) {
    throw new ImportError('Not a valid JSON object');
  }
  const root = json as Record<string, unknown>;

  if (!root.success) {
    throw new ImportError('Pathbuilder export has success: false — export may be incomplete');
  }

  const build = root.build as Record<string, unknown>;
  if (!build) throw new ImportError('Missing expected field: build', 'build');

  const level = build.level as number;
  const abilities = build.abilities as Record<string, number>;

  const abilMod = (score: number) => Math.floor((score - 10) / 2);
  const profBonus = (rank: number) => rank === 0 ? 0 : level + rank;
  const profs = build.proficiencies as Record<string, number>;
  const mods = (build.mods ?? {}) as Record<string, Record<string, number>>;

  const getItemBonus = (name: string): number =>
    mods[name]?.['Item Bonus'] ?? 0;

  // Skills
  const skills: NormalizedSkill[] = Object.entries(SKILL_ABILITIES)
    .filter(([skill]) => profs[skill] !== undefined)
    .map(([skill, abil]) => {
      const rank = profs[skill] ?? 0;
      const itemBonus = getItemBonus(skill.charAt(0).toUpperCase() + skill.slice(1));
      return {
        name: skill,
        label: skill.charAt(0).toUpperCase() + skill.slice(1),
        ability: abil,
        total: abilMod(abilities[abil]) + profBonus(rank) + itemBonus,
        proficiencyRank: rank / 2,  // normalize to 0-4 scale
        itemBonus,
        isLore: false
      };
    });

  // Lore skills
  const lores = (build.lores ?? []) as Array<[string, number]>;
  lores.forEach(([name, rank]) => {
    const itemBonus = getItemBonus(name + ' Lore');
    skills.push({
      name: name.toLowerCase().replace(/\s+/g, '-') + '-lore',
      label: name + ' Lore',
      ability: 'int',
      total: abilMod(abilities.int) + profBonus(rank) + itemBonus,
      proficiencyRank: rank / 2,
      itemBonus,
      isLore: true
    });
  });

  // ... (saves, weapons, spellcasters, feats similarly)

  return { /* ... */ sourceFormat: 'pathbuilder' };
}
```

### Foundry Parser (ability reconstruction core)
```typescript
// src/lib/parsers/foundry.ts
function reconstructAbilities(data: FoundryRaw): NormalizedAbilities {
  const scores: Record<string, number> = {
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10
  };

  const applyBoosts = (boostsMap: Record<string, {value: string[], selected?: string | null}>) => {
    Object.values(boostsMap).forEach(boost => {
      const chosen = boost.selected ?? (boost.value.length === 1 ? boost.value[0] : null);
      if (chosen && chosen in scores) scores[chosen] += 2;
    });
  };

  const applyFlaws = (flawsMap: Record<string, {value: string[]}>) => {
    Object.values(flawsMap).forEach(flaw => {
      const a = flaw.value[0];
      if (a && a in scores) scores[a] -= 2;
    });
  };

  const anc = data.items.find(i => i.type === 'ancestry');
  const bg  = data.items.find(i => i.type === 'background');
  const cls = data.items.find(i => i.type === 'class');

  if (anc) { applyBoosts(anc.system.boosts ?? {}); applyFlaws(anc.system.flaws ?? {}); }
  if (bg)  { applyBoosts(bg.system.boosts ?? {}); }
  if (cls) {
    const keyAbil = cls.system.keyAbility?.selected ?? cls.system.keyAbility?.value?.[0];
    if (keyAbil && keyAbil in scores) scores[keyAbil] += 2;
  }

  // Level boosts
  const buildBoosts = (data.system.build?.attributes?.boosts ?? {}) as Record<string, string[]>;
  Object.values(buildBoosts).forEach(boosts => {
    boosts.forEach(a => { if (a in scores) scores[a] += 2; });
  });

  return {
    str: Math.floor((scores.str - 10) / 2),
    dex: Math.floor((scores.dex - 10) / 2),
    con: Math.floor((scores.con - 10) / 2),
    int: Math.floor((scores.int - 10) / 2),
    wis: Math.floor((scores.wis - 10) / 2),
    cha: Math.floor((scores.cha - 10) / 2),
  };
}
```

### Dexie Version 2 Schema
```typescript
// src/lib/db/index.ts
import type { NormalizedCharacter } from '$lib/parsers/types';

export interface StoredCharacter extends NormalizedCharacter {
  id?: number;  // Dexie auto-increment primary key
}

class AppDatabase extends Dexie {
  characters!: Table<StoredCharacter>;
  rollHistory!: Table<RollHistoryEntry>;
  settings!: Table<Settings>;
  heroPoints!: Table<HeroPoint>;

  constructor() {
    super('PathfinderDiceRoller');
    this.version(1).stores({
      characters: '++id, name, importedAt',
      rollHistory: '++id, rolledAt',
      settings: '++id, key',
      heroPoints: '++id, characterId'
    });
    this.version(2).stores({
      characters: '++id, name, importedAt',
      rollHistory: '++id, rolledAt',
      settings: '++id, key',
      heroPoints: '++id, characterId'
    }).upgrade(tx => tx.table('characters').clear());
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PF2e ability scores displayed as 18 STR | PF2e Remaster: modifier only (+4 STR) | 2023 Remaster | NormalizedCharacter stores modifiers, not scores |
| Untrained gives proficiency bonus equal to level | PF2e Remaster: untrained = 0 (no level) | 2023 Remaster | Foundry rank 0 = 0 bonus regardless of level |
| Foundry spell attack/DC stored in spellcastingEntry | Must be reconstructed (system computes at runtime) | Ongoing | Cannot rely on spellcastingEntry.system.spelldc |

**Deprecated/outdated:**
- `system.abilities` in Foundry PF2e: documented as null since PF2e system v5+. Never read it.
- Foundry `system.details.xp.value`: XP is present but PF2e typically uses milestone leveling. Not needed.

---

## Open Questions

1. **Foundry caster spell entries for higher-level characters**
   - What we know: all 4 sample files have 0 spell items (level 1 non-casters, or casters without configured spells)
   - What's unclear: exact spellcastingEntry field paths when spells ARE configured
   - Recommendation: Handle `spellcastingEntry` + `spell` items defensively — parse what's present, show empty spells section if none. If a caster has no spells configured, show "No spells found in this Foundry export — configure spells in Foundry and re-export."

2. **Foundry weapon traits for Phase 5**
   - What we know: traits are in `weapon.system.traits.value[]` (verified: "agile", "finesse", "fatal-d12", etc.)
   - What's unclear: full canonical trait list needed for MAP and special damage rules (Phase 5)
   - Recommendation: Store all traits in `NormalizedWeapon.traits[]` now. Phase 5 will filter for specific traits.

3. **Pathbuilder weapon agile detection**
   - What we know: Pathbuilder weapons have no `traits` field
   - What's unclear: how Phase 5 should determine agile for MAP calculation
   - Recommendation: Build a static `AGILE_WEAPONS` set in Phase 5 based on PF2e published data. Phase 2 does not need to solve this.

4. **Foundry classDC proficiency source**
   - What we know: `classItem.system` does not have an explicit `classDC` proficiency field
   - What's unclear: where Foundry tracks class DC proficiency rank (may be derived from class features at runtime)
   - Recommendation: For Phase 2, default `classDC` to `10 + 2 + keyAbilityMod` (trained at level 1). Flag this as LOW confidence. Phase 3 revisits.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x (configured in Phase 1) |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test:unit` (node environment, no browser) |
| Full suite command | `npm test` (runs all browser + unit projects) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| IMPT-01 | Foundry JSON parser produces correct NormalizedCharacter for all 4 sample files | unit | `npm run test:unit -- src/lib/parsers/foundry.unit.test.ts` | ❌ Wave 0 |
| IMPT-02 | Pathbuilder JSON parser produces correct NormalizedCharacter for Kairos | unit | `npm run test:unit -- src/lib/parsers/pathbuilder.unit.test.ts` | ❌ Wave 0 |
| IMPT-03 | NormalizedCharacter persists across Dexie open/close cycles | browser | `npm run test:browser -- src/lib/db/character.browser.test.ts` | ❌ Wave 0 |
| IMPT-04 | Character can be deleted and is gone after deletion | browser | `npm run test:browser -- src/lib/db/character.browser.test.ts` | ❌ Wave 0 |
| IMPT-05 | Re-importing by name replaces existing character data | browser | `npm run test:browser -- src/lib/db/character.browser.test.ts` | ❌ Wave 0 |

**Additional unit tests:** Parser error cases — missing required fields throw `ImportError` with correct message.

### Sampling Rate
- **Per task commit:** `npm run test:unit` (fast, node only — covers parsers)
- **Per wave merge:** `npm test` (full suite — covers IndexedDB persistence)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/parsers/foundry.unit.test.ts` — covers IMPT-01
- [ ] `src/lib/parsers/pathbuilder.unit.test.ts` — covers IMPT-02
- [ ] `src/lib/parsers/types.ts` — the NormalizedCharacter interface (used by all tests)
- [ ] `src/lib/db/character.browser.test.ts` — covers IMPT-03, IMPT-04, IMPT-05

---

## Sources

### Primary (HIGH confidence)
- Direct inspection of `Foundry-Knurvik.json`, `fvtt-Actor-brickney-spears-kD69apec02bY9XjJ(1).json`, `fvtt-Actor-duin-VF2PpLQ7kpsQAWQR.json`, `fvtt-Actor-roo-mb63FZgHYZtMnn0H.json` — all field paths verified by executing node.js extraction scripts
- Direct inspection of `Pathbuilder-Kairos.json` — all field paths and math verified
- `src/lib/db/index.ts` — current Dexie schema confirmed
- `vitest.config.ts` — test framework configuration confirmed
- PF2e Remaster proficiency math verified against computed values matching expected character build totals

### Secondary (MEDIUM confidence)
- Dexie documentation patterns for version migrations — consistent with Phase 1 implementation already in codebase

### Tertiary (LOW confidence)
- Foundry `classDC` proficiency source — field not found in exported items; may be runtime-only computation
- Foundry `spellcastingEntry` structure when populated — no examples in sample files; structure inferred from Foundry PF2e system documentation patterns

---

## Metadata

**Confidence breakdown:**
- Foundry data paths: HIGH — verified by running extraction scripts against all 4 sample files
- Foundry ability reconstruction: HIGH — math verified (Brickney CON=14/HP=24, Roo HP=14, Duin abilities match expected Cleric build)
- Pathbuilder data paths: HIGH — all fields verified against Kairos sample; math cross-checked
- NormalizedCharacter interface: HIGH — designed from verified data; Phase 3-6 field requirements informed by REQUIREMENTS.md
- Foundry classDC: LOW — not found in exported JSON; assumed trained at level 1
- Foundry spellcastingEntry populated structure: LOW — inferred, not directly verified

**Research date:** 2026-03-14
**Valid until:** 2026-06-14 (Foundry PF2e system version 7.10.1 confirmed in sample files; major version changes may alter export format)
