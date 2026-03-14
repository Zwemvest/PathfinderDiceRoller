# Pitfalls Research

**Domain:** PF2e dice roller / character sheet importer (PWA, client-side, GitHub Pages)
**Researched:** 2026-03-14
**Confidence:** HIGH (rules verified against Archives of Nethys; format findings verified against actual sample JSON files in repo)

---

## Critical Pitfalls

### Pitfall 1: Degree-of-Success Order of Operations Error

**What goes wrong:**
The code applies natural 20 / natural 1 adjustments after other degree-of-success shifts (e.g., from feats like Assurance or spell effects), producing wrong results. Alternatively, code applies the nat-20/nat-1 shift before computing the numeric margin, rather than after — producing double-shifting.

**Why it happens:**
PF2e has a specific resolution order: (1) compute numeric result vs DC, (2) apply nat-20/nat-1 shift first, (3) then apply any other degree adjustments. Developers familiar with D&D 5e assume a natural 20 is always a crit and don't model the margin at all. Others apply adjustments in the wrong sequence.

**Concrete rule:**
- Roll d20 + modifiers → compare to DC → determine raw degree (crit fail / fail / success / crit success)
- If nat-20: shift one step better FIRST, before any other adjustment
- If nat-1: shift one step worse FIRST
- Then apply any additional step-shift effects

**Tricky edge cases:**
- High modifier + nat-1: if (1 + modifier) ≥ DC+10, the nat-1 shifts you down from crit-success to success — not an automatic failure
- Low modifier + nat-20: if (20 + modifier) is still 10+ below DC, nat-20 only shifts you from crit-failure to failure, not a success
- Multiple degree-shift effects (some feats, some spells): must all apply after nat-1/nat-20 is resolved

**How to avoid:**
Model the resolution as a pipeline with an explicit order: compute numeric degree → apply nat modifier → apply additional shifts. Encode this as a pure function with unit tests for all four starting degrees crossed with nat-20, nat-1, and each additional shift direction.

**Warning signs:**
- A character with +20 modifier fails against DC 1 (should crit-succeed even on nat-1)
- Crit-fail becomes success in a single step when a degree-shift effect is present
- Test: roll nat-20 with modifier that already beats DC by 10 — still crit-success, not "double crit"

**Phase to address:** Rules engine phase (before any UI work). Write unit tests before implementing.

---

### Pitfall 2: Bonus Type Stacking — Adding All Modifiers Naively

**What goes wrong:**
The modifier accumulation function adds every bonus together. Status bonuses from two different spells both apply, item bonuses from two items both apply, etc. Rolls come out 3-6 points too high.

**Why it happens:**
PF2e has four bonus/penalty categories: status, circumstance, item, and untyped. Within each typed category, only the highest bonus applies (and only the worst penalty applies). Untyped values always stack. Developers unfamiliar with the system treat all modifiers as additive.

**Concrete rules:**
- Status bonuses: take only the highest
- Status penalties: take only the worst
- Circumstance bonuses: take only the highest
- Circumstance penalties: take only the worst
- Item bonuses: take only the highest
- Item penalties: take only the worst
- Untyped: all stack
- A bonus and a penalty of the same type both apply independently (they don't cancel to zero)

**How to avoid:**
Build a typed modifier aggregator early. Data model: `{ type: 'status' | 'circumstance' | 'item' | 'untyped', value: number, source: string }`. Aggregation: for each typed category, keep `Math.max(...bonuses)` and `Math.min(...penalties)` separately; sum all untypeds. Never store a raw total — store the modifier list and compute at roll time.

**Warning signs:**
- Haste + Bless both active: character has +2 status to attacks (correct is +1 — highest wins)
- Two magic items both granting +1 item bonus to Acrobatics: total item bonus should be +1, not +2
- Any UI that shows "total modifier" without showing the type breakdown

**Phase to address:** Rules engine phase. The data model must be correct from day one — retrofitting typed stacking onto a raw-number model requires a full refactor.

---

### Pitfall 3: Critical Hit Damage Calculation for Deadly/Fatal Weapons

**What goes wrong:**
On a critical hit, the code doubles all the dice (including deadly/fatal extra dice), or it doubles only the base dice and ignores the extra trait dice entirely. Both are wrong.

**Why it happens:**
The rule is non-obvious: double the entire damage expression (base dice + static modifiers), then add the trait's extra dice afterward. The deadly/fatal dice are not doubled. Developers either forget to add trait dice or they double everything.

**Concrete rules:**

*Deadly trait (e.g., deadly d10):*
- Critical: roll base dice + modifiers → double the total → then add 1 deadly die (2 with greater striking, 3 with major striking)
- Deadly die size is fixed by the trait, not by the weapon's base die

*Fatal trait (e.g., fatal d12):*
- Critical: replace the weapon's damage die size with the fatal die size, roll normally → double total → then add 1 additional fatal die
- Fatal die scaling: 1 extra die (2 with greater striking, 3 with major striking)
- The replacement die and bonus dice are NOT doubled

**Striking rune interaction:** Striking rune increases the number of base dice (1d8 → 2d8 → 3d8). All base dice get doubled on a crit. The deadly/fatal bonus dice do not.

**How to avoid:**
Model damage as: `(baseRoll × 2) + critBonusDice`. Never fold trait dice into the doubled expression. Weapon data should carry `{ baseDice, fatalDie, deadlyDie, strikingRunes }` separately.

**Warning signs:**
- A striking longsword (deadly d8) crits for `4d8×2 + 1d8` instead of `(2d8+mods)×2 + 1d8`
- Fatal weapon crits for the same expected value as a non-fatal weapon of the same base die size

**Phase to address:** Damage rolling phase. Test with at least one deadly weapon and one fatal weapon against explicit expected ranges.

---

### Pitfall 4: Multiple Attack Penalty Applied to Wrong Weapon

**What goes wrong:**
MAP is calculated based on the first weapon used, not the current weapon. A player uses an agile dagger first (MAP: -4/-8), then attacks with a non-agile longsword — the code applies -4 instead of the correct -5.

**Why it happens:**
The PF2e rule is "calculate MAP based on the weapon you are using on this attack." Most implementations track MAP as a global counter and fail to re-derive the penalty from the current weapon's traits.

**Concrete rule:**
Second attack MAP = `weapon.hasAgile ? -4 : -5`
Third+ attack MAP = `weapon.hasAgile ? -8 : -10`
MAP derives from the weapon being swung on that attack, not the weapon swung first.

**Edge cases beyond agile:**
- Ranger's Flurry Edge: reduces MAP by 2 (further stacks with agile)
- Flurry of Blows (monk): reduces MAP
- Some feats modify MAP for specific weapon groups

**How to avoid:**
MAP is a function of `(attackNumber, currentWeapon, characterFeats)` — not a mutable global counter. Compute it fresh each time rather than tracking cumulative state.

**Warning signs:**
- Switching weapons mid-round produces a MAP value that doesn't match the equipped weapon's agile trait
- MAP for third attack with agile weapon shows -10 instead of -8

**Phase to address:** Attack rolling phase, when MAP selector UI is built.

---

### Pitfall 5: Foundry JSON Has No Pre-Computed Skill Totals — Must Derive

**What goes wrong:**
The importer looks for a `totalBonus` field on skills in the Foundry JSON and finds nothing (or finds an empty `{}` for `system.skills`). It falls back to zero, producing wrong skill rolls.

**Why it happens:**
The Foundry PF2e system computes skill totals at runtime from the actor data — the exported JSON stores raw components, not final values. The `system.skills` object in the export is empty (`{}`), as confirmed by the sample file. Pathbuilder, by contrast, stores final computed attack bonuses (`attack: 15`) directly.

**Concrete difference (from actual sample files):**
- Pathbuilder weapon: `{ attack: 15, damageBonus: 4, die: "d8", str: "striking" }` — pre-computed
- Foundry weapon: `{ system: { bonus: { value: 0 }, damage: { dice: 1, die: "d8" } } }` — bonus is base, must add proficiency + ability + potency rune
- Foundry skills: `system.skills = {}` (empty in export) — must recompute from proficiency rank + ability mod + level

**How to avoid:**
For Foundry imports: always derive skill/attack values from components. The formula is `proficiencyBonus + abilityMod + itemBonus + level (if trained)`. Potency rune adds to attack rolls (`system.runes.potency`). For Pathbuilder: use the pre-computed values but verify against available component fields.

**Warning signs:**
- All Foundry characters roll at -2 to +2 on every skill (raw ability mod with no proficiency)
- Attack bonus for a weapon comes out as 0 or 1 (only rune value, no proficiency added)
- Pathbuilder characters roll correctly but Foundry ones do not

**Phase to address:** Character import phase. Write a test that imports the sample Foundry JSON and verifies at least three skill totals against expected values.

---

### Pitfall 6: Pathbuilder Spells Are Names Only — No Damage Expressions

**What goes wrong:**
The spell list from a Pathbuilder import is displayed correctly, but when the user tries to roll spell damage, there's nothing to roll — the JSON only contains spell names, not damage dice or attack bonus fields.

**Why it happens:**
Pathbuilder's JSON `spellCasters[].spells[].list` is an array of strings (spell names only). There is no damage expression, no attack bonus, no save DC embedded. Foundry exports include spell items with full stat blocks but the sample character has zero spells, so this difference only becomes visible with a caster character.

**Concrete example (from sample file):**
```json
"spells": [{ "spellLevel": 0, "list": ["Detect Magic", "Gouging Claw", ...] }]
```

**How to avoid:**
For Pathbuilder imports, spell rolling must either: (a) prompt the user to manually enter damage when rolling a spell, or (b) display a "roll attack/damage" button that opens the free dice roller. Do not try to infer spell damage from name matching — that path requires a full spell database (explicitly out of scope). For Foundry imports, parse spell items normally.

**Warning signs:**
- Assuming both import formats have equivalent data depth
- Building spell damage auto-roll before verifying the data is actually present
- "It works for Foundry characters" passing as a test when the Pathbuilder path is untested

**Phase to address:** Character import phase. Document the data gap clearly in the UI so users know spell damage requires manual input for Pathbuilder imports.

---

### Pitfall 7: Pathbuilder `mods` Object Has Typed Bonus Keys as Strings

**What goes wrong:**
The Pathbuilder `mods` object stores conditional modifiers using bonus-type strings as keys (`"Item Bonus"`, `"Status Bonus"`, etc.). Code that expects numeric keys or ignores this object misses situational bonuses that are already encoded in the export.

**Concrete example (from sample file):**
```json
"mods": {
  "Arcana": { "Item Bonus": 1 },
  "Stealth": { "Item Bonus": 1 },
  "Reflex": { "Item Bonus": 3 }
}
```

**Why it happens:**
Developers focus on `proficiencies` and `abilities` for skill calculation and don't notice `mods` as a separate modifier layer. These represent item/situational bonuses that should feed the typed modifier aggregator.

**How to avoid:**
Explicitly parse `mods` during Pathbuilder import. Map the string keys to modifier types: `"Item Bonus"` → `{ type: 'item', value: 1 }`. Feed into the same typed modifier system used for all other sources.

**Warning signs:**
- A Pathbuilder character with a magic item that grants a skill bonus rolls the skill without it
- `mods` object is parsed but stored as a raw string-keyed object, bypassing the stacking rules

**Phase to address:** Character import phase, specifically the Pathbuilder parser.

---

### Pitfall 8: Foundry Feat Rule Elements Embedded as Fist Strikes / ItemAlteration

**What goes wrong:**
The Foundry JSON's feat `system.rules` array contains programmatic rule elements (not just text). Code that ignores `rules` on feat items misses mechanics like unarmed strike upgrades (e.g., Powerful Fist changing fist damage to d6).

**Concrete example (from sample file):**
```json
"rules": [
  { "fist": true, "img": "...", "key": "Strike" },
  { "itemId": "xxxxxxFISTxxxxxx", "key": "ItemAlteration", "mode": "upgrade", "property": "damage-dice-faces" }
]
```

**Why it happens:**
Rule elements are Foundry-specific automation JSON. They're not self-documenting and require knowledge of the PF2e Foundry system's rule element schema to interpret. Most importers skip them.

**How to avoid:**
The project has explicitly scoped feat auto-parsing as "manual overrides for feats that can't be auto-parsed." This is the right call given the complexity. However, a small subset of rule elements are structurally parseable (Strike additions, simple flat modifiers). Pre-screen for `key: "Strike"` rule elements as they indicate an unarmed or natural weapon that needs to appear in the attack list. Flag the rest for manual override.

**Warning signs:**
- A monk with Powerful Fist shows no fist attack in the attack list, or fist rolls 1d4 instead of 1d6
- Feats with `rules.length > 0` are silently ignored with no user notification

**Phase to address:** Character import phase. Build the manual override UI before attempting rule element parsing.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store pre-computed attack totals from Pathbuilder directly without modeling components | Faster initial implementation | Cannot apply temporary bonuses/penalties to Pathbuilder characters | Never — store components, compute totals at roll time |
| Raw number for modifier total instead of typed modifier list | Simpler data model | Stacking rules become impossible to enforce later; requires full data model refactor | Never for rolls; OK for display-only values |
| Single MAP counter incremented globally | Easy to implement | Breaks when switching weapons mid-round | Never — MAP must derive from current weapon |
| Hard-code critical hit as "double dice count" | Passes basic tests | Deadly/fatal traits produce wrong results; fails on every magic weapon | Never |
| Skip `mods` parsing in Pathbuilder import | Less code in parser | Characters missing item bonuses from gear | Never — `mods` is the only place these live in Pathbuilder JSON |
| Skip degree-of-success pipeline, treat nat-20 as auto-crit | Simple | Fails edge cases with very high/low modifiers vs DC | Never for a rules-correct roller |
| Store entire character JSON blob in a single IndexedDB record | Simple schema | Partial updates require full re-writes; hard to query | Acceptable for MVP if schema is versioned from day one |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Foundry JSON import | Expecting `system.skills` to have values — it's empty | Derive all skill totals from proficiency rank + ability score + level formula |
| Foundry JSON import | Treating `system.abilities` as null = no ability scores | Foundry abilities: `null` in export (sample shows this); derive from items or use Pathbuilder as ground truth |
| Pathbuilder JSON import | Treating `build.weapons[0].attack` as needing re-derivation | It's pre-computed; use directly but still route through typed modifier system for situational bonuses |
| Pathbuilder JSON import | Ignoring `build.mods` object | It contains bonus-type-keyed situational modifiers that must feed the stacking engine |
| Pathbuilder spell lists | Trying to infer damage from spell name | Names only; no damage data present; show free-roll prompt instead |
| GitHub Pages deployment | Deploying `index.html` with no cache headers, service worker caches forever | Set `Cache-Control: no-cache` for `service-worker.js` itself; use build-hash asset versioning for everything else |
| IndexedDB on iOS | Opening IDB without error handling | iOS has historically corrupted IDB on low storage; always wrap in try/catch, show recovery UI |
| Fortune/misfortune | Allowing hero point reroll when a misfortune effect is also active | Fortune and misfortune cancel — user rolls normally, not with reroll |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recomputing typed modifier aggregation on every render | UI lag on characters with many feats/items | Memoize modifier totals; recompute only on character mutation | ~50+ active modifiers (possible for high-level PCs) |
| Storing full roll history in memory, never paginating IndexedDB reads | App startup slow; memory climbs per session | Load only last N rolls on startup; paginate history queries | ~500+ stored rolls (one long campaign session) |
| Parsing all character items on every roll for applicable bonuses | Noticeable delay per roll on GM mode with many NPCs | Pre-index modifier list when character loads; store indexed form in memory | ~10+ characters loaded simultaneously in GM mode |
| Rebuilding service worker cache list manually per deploy | Old assets served after deploy; users see stale UI | Use Vite/Workbox to auto-generate cache manifest from build output | Every deployment without automation |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing character JSON in localStorage instead of IndexedDB | 5MB limit causes silent data truncation for large Foundry exports (some PF2e actors are 200KB+) | Always use IndexedDB; localStorage is never acceptable for character data |
| Parsing imported JSON with `eval()` or dynamic code execution | Code injection via crafted JSON export | Use `JSON.parse()` only; never eval; validate structure with schema (zod or equivalent) |
| Treating imported JSON as trusted data | A crafted JSON could set absurd modifier values that look legit | Clamp ability scores 1-30, modifier bonuses to reasonable ranges; log anomalies |
| Exposing roll history export as unformatted blob | GMs cannot verify authenticity | Include session ID, character name, and timestamp in export; make tampering obvious |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing modifier total without breakdown | Player can't tell why their roll is wrong; "where did +17 come from?" | Always show modifier breakdown on tap/hover: proficiency + ability + item + status |
| MAP selector resets after every roll | Player must re-select attack number constantly during a flurry | Persist MAP state until end of turn; add explicit "New Turn" button to reset |
| Silent import failure when JSON structure doesn't match expected schema | Character loads with all zeros; player assumes the app is broken | Validate on import; show specific field-level errors ("Expected `build.abilities.str` to be a number") |
| Spell damage requires DC entry to show degree of success but spell attack requires an attack roll | Players confused about which prompt appears for which spell | Pre-classify spells as attack/save/utility at import time; show appropriate UI immediately |
| Roll history log not distinguishing which character rolled | In GM mode, log becomes unreadable | Always prefix each log entry with character name and roll type |
| Fortune/misfortune effect state not visible | Player forgets they have a misfortune effect active; tries to use hero point | Show active fortune/misfortune effects prominently; disable hero point button when fortune already active |
| Themes breaking dice result color coding | "Critical success = green" unreadable on parchment theme | Use theme-aware semantic tokens for result states, not hard-coded colors |

---

## "Looks Done But Isn't" Checklist

- [ ] **Degree of success:** Verified nat-20 on a roll that already meets DC by 10 stays crit-success (not "double crit")
- [ ] **Degree of success:** Verified nat-1 with modifier so high that 1+mod ≥ DC still produces success (not auto-fail)
- [ ] **Degree of success:** Verified additional degree-shift (from a feat) applies AFTER nat-20/nat-1 resolution
- [ ] **Modifier stacking:** Two status bonuses present — only highest is applied
- [ ] **Modifier stacking:** A status bonus and a status penalty both present — both independently applied, not cancelled
- [ ] **Deadly weapon crit:** Deadly dice are added AFTER doubling, not included in the doubled expression
- [ ] **Fatal weapon crit:** Die size replaced for all base dice, then result doubled, then extra die added
- [ ] **MAP:** Attack 2 with longsword after using an agile dagger first shows -5 (longsword's MAP), not -4
- [ ] **MAP:** Agile weapon third attack shows -8, not -10
- [ ] **Foundry import:** Skill totals are non-zero and match expected values from character sheet
- [ ] **Pathbuilder import:** `mods` object item bonuses appear in roll breakdown
- [ ] **Pathbuilder import:** Spell list displays but damage rolls show free-roller prompt (not crash)
- [ ] **Hero point reroll:** Cannot trigger if a fortune effect already applies to this roll
- [ ] **Fortune/misfortune cancel:** When both apply, roll is made normally (no reroll either direction)
- [ ] **IndexedDB:** Quota exceeded error is caught and shows a user-facing message, not a console error
- [ ] **iOS PWA:** Data persists after 7+ days when installed to home screen (not in Safari tab)
- [ ] **GitHub Pages:** After a new deploy, users get new assets within one session (not stuck on old SW cache)
- [ ] **GM mode:** Roll history log shows character name on every entry
- [ ] **Import validation:** Malformed JSON shows field-specific error, not a generic crash

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Degree-of-success order wrong | MEDIUM | Fix resolution pipeline; all existing saves/attack tests pass with corrected order; no data migration needed |
| Typed modifier stacking wrong | HIGH | Data model refactor required if raw totals were stored; if modifier lists were stored from day one, fix is in aggregation function only |
| Critical damage formula wrong | LOW | Fix calculation function; re-test all weapon types; no stored data affected |
| MAP derives from wrong weapon | LOW | Fix MAP derivation function; stateless computation, no stored data |
| Foundry skill totals wrong | LOW | Fix derivation formula in importer; re-import character (user action) |
| Pathbuilder `mods` ignored | LOW | Add `mods` parsing; re-import character |
| IndexedDB quota exceeded, no error handling | HIGH | App crashes silently; users lose trust; add try/catch everywhere and export-before-clear recovery flow |
| Service worker caching stale assets post-deploy | MEDIUM | Force unregister + hard reload workaround; long term: fix build pipeline |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Degree-of-success order of operations | Rules engine (Phase 1) | Unit tests: all 4 degrees × nat-1/20 × additional shifts |
| Bonus type stacking | Rules engine (Phase 1) | Unit tests: two status bonuses → only highest applied |
| Deadly/fatal critical damage | Damage rolling (Phase 2) | Integration tests with actual weapon traits from sample JSON |
| MAP derives from wrong weapon | Attack rolling (Phase 2) | Test: agile → non-agile weapon switch mid-round |
| Foundry skill totals empty | Character import (Phase 3) | Import sample Foundry JSON; verify 5 skill totals match expected |
| Pathbuilder spells names-only | Character import (Phase 3) | Import Pathbuilder caster; verify spell damage shows free-roller prompt |
| Pathbuilder `mods` ignored | Character import (Phase 3) | Import sample Pathbuilder JSON; verify Arcana shows +1 item bonus |
| Foundry rule elements on feats | Character import (Phase 3) | Verify Powerful Fist produces a fist attack entry; others flagged for manual override |
| IndexedDB quota + iOS instability | Storage layer (Phase 1 or 2) | Simulate quota exceeded; verify error is caught and displayed |
| Service worker stale cache | Build/deploy pipeline (Phase 1) | Deploy a change; reload in installed PWA; verify new version loads |
| Fortune/misfortune interaction | Roll UX (Phase 3–4) | Verify hero point disabled when fortune active; verify both cancel each other |

---

## Sources

- Archives of Nethys: Degree of Success — https://2e.aonprd.com/Rules.aspx?ID=2286
- Archives of Nethys: Natural 20 / Natural 1 — https://2e.aonprd.com/Rules.aspx?ID=2287
- Archives of Nethys: Multiple Attack Penalty — https://2e.aonprd.com/Rules.aspx?ID=2289
- Archives of Nethys: Deadly trait — https://2e.aonprd.com/Traits.aspx?ID=570
- Archives of Nethys: Fatal trait — https://2e.aonprd.com/Traits.aspx?ID=597
- Archives of Nethys: Bonuses and Penalties (stacking rules) — https://2e.aonprd.com/Rules.aspx?ID=315
- Archives of Nethys: Hero Points — https://2e.aonprd.com/Rules.aspx?ID=2333
- Foundry PF2e Rule Elements wiki — https://github.com/foundryvtt/pf2e/wiki/Quickstart-guide-for-rule-elements
- MDN: Storage quotas and eviction criteria — https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- WebKit: Updates to Storage Policy (iOS persistent storage API) — https://webkit.org/blog/14403/updates-to-storage-policy/
- IndexedDB pain points (community gist) — https://gist.github.com/pesterhazy/4de96193af89a6dd5ce682ce2adff49a
- Pathmuncher (Pathbuilder→Foundry importer, naming differences documented) — https://github.com/MrPrimate/pathmuncher
- Rich Harris service worker gotchas — https://gist.github.com/Rich-Harris/fd6c3c73e6e707e312d7c5d7d0f3b2f9
- Direct inspection of `Foundry-Knurvik.json` and `Pathbuilder-Kairos.json` sample files in repo (HIGH confidence — primary sources)

---
*Pitfalls research for: PF2e Dice Roller (client-side PWA, GitHub Pages)*
*Researched: 2026-03-14*
