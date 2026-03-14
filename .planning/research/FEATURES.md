# Feature Research

**Domain:** PF2e dice roller (character-sheet-integrated, PWA)
**Researched:** 2026-03-14
**Confidence:** MEDIUM — Foundry PF2e system has extensive documentation via GitHub; Pathbuilder web app blocked direct access, supplemented with patch notes and issue tracker; D&D Beyond features confirmed via official announcements.

---

## Competitor Analysis

### D&D Beyond Dice Roller — What It Does

D&D Beyond integrates dice directly into the character sheet. Every clickable stat rolls correctly with modifiers already applied. The UI is polished and approachable.

**Strengths:**
- Single-click rolls from all character sheet elements (skills, saves, attacks, damage)
- Right-click context menu for advantage/disadvantage/flat roll on any d20 roll
- Right-click damage box for critical hit rolls
- 3D animated dice (cosmetic, shareable in campaign)
- Game Log: persistent roll history shared across party, accessible from character sheet, campaign page, and encounters — shows action rolled, result + modifiers, dice visual
- Roll privacy controls (self/party/DM only)
- Campaign-linked sharing — party sees each other's rolls in real time
- Inline dice integration in character sheet (no separate dice panel)

**Weaknesses / Gaps:**
- Built for D&D 5e, not PF2e — no degree of success (crit success/failure), no MAP, no PF2e condition types
- Advantage/disadvantage is manual (right-click) — not auto-detected from conditions
- No DC entry on a roll — degree of success must be calculated by hand
- Hidden DM rolls are a known pain point (player rolls visible to DM is a recurring community complaint)
- 3D dice engine is being rebuilt (as of late 2025) — known instability
- No offline support — requires internet/account

**Verdict for parity:** The Game Log concept (party-visible roll history), single-click from sheet, and right-click advantage/disadvantage are the features to match. The D&D-centric features (spell slots as 5e, etc.) don't apply.

---

### Pathbuilder 2e Dice Roller — What It Does

Pathbuilder is primarily a character builder that doubles as a character sheet. Its dice roller is tightly integrated into the sheet UI — click a modifier, get a popup roll.

**Strengths:**
- Click-to-roll for all relevant modifiers: skills, saves, attacks, damage dice
- Modifiers pre-calculated from character data — no manual math
- Damage by type breakdown shown in roller details (slashing, fire, etc.)
- Creature/NPC mode also supports click-to-roll on modifiers
- PF2e rules-aware (proficiency + level + ability mod correctly computed)
- dddice browser extension integration for 3D shared dice

**Weaknesses / Gaps:**
- No built-in MAP UI — players must manually track which attack they're on; no "-5 / -10" indicator or toggle
- No hero point reroll button — must re-roll manually and discard first result
- No DC entry on roll — degree of success (critical success/failure) not auto-computed; player reads result and calculates by hand
- No roll history / dice log — a feature request was filed asking for a D&D Beyond-style log (GitLab issue #1676); no evidence it shipped
- No check prompt / GM-initiated roll request — GM cannot send a "roll Perception DC 20" button to players
- No status/circumstance/item bonus toggle — if a buff applies, player must add it manually or it's pre-baked into the sheet value
- No session tagging — rolls are ephemeral within the popup
- No offline/PWA support — requires internet

**Verdict for parity:** Click-to-roll with pre-calculated modifiers and damage-by-type display are the baseline expectations. The gaps (MAP, hero points, DC entry, roll log) are exactly where this project can leapfrog Pathbuilder.

---

### Foundry VTT PF2e System Dice Roller — What It Does

The Foundry PF2e system is the gold standard for PF2e automation. It is a full VTT, not a standalone roller, but its rolling features define what "full PF2e support" means.

**Strengths:**
- Full character-sheet click-to-roll: skills, saves, attacks, spells, initiative, perception
- Check dialog before rolling: shows modifiers list, allows adding situational bonuses, has DC entry field
- Degree of success auto-computed from DC: critical success/failure/success/failure displayed in chat with color-coded banner
- Natural 20 / natural 1 automatically shifts degree of success one step
- Modifier breakdown in chat: every modifier shown labeled (proficiency, ability, status, item, circumstance) — not just a total
- Multiple Attack Penalty: auto-tracked, appears as button on attack card (use MAP -5 or MAP -10 before rolling)
- Hero point reroll: right-click on a chat roll to reroll using hero point
- Roll privacy modes: public, GM-only (blind), self-only, party
- Inline roll links: can embed clickable rolls in journal/scene notes with DC baked in
- GM-initiated check prompts: party sheet or macro creates "roll Perception DC 20" button in chat that players click
- Conditions/effects auto-applied: frightened, clumsy, etc. automatically modify rolls
- Roll history in chat log: scrollable, filterable, timestamps, exportable
- Arbitrary dice roller: freeform syntax in chat (/roll 3d6+2)
- Flat check support, secret rolls, blind rolls
- Agile MAP (-4/-8) correctly applied vs standard (-5/-10)
- Reroll options: roll twice keep higher/lower (fortune/misfortune effects)

**Weaknesses / Gaps:**
- Requires full Foundry VTT install + server hosting — not accessible without setup
- Overkill for players who only need their own character
- No offline/PWA — server-dependent
- GM must manage the instance; players need invites
- Feature richness creates UI complexity — lots of buttons, dialogs, chat noise

**Verdict for parity:** The Foundry PF2e system establishes the feature ceiling. Everything it does for rolling is what "full PF2e dice roller parity" means.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Click-to-roll from character sheet (skills, saves, attacks, spells) | Pathbuilder and D&D Beyond both do this; users expect it | MEDIUM | Requires parsing character JSON into rollable elements |
| Pre-calculated modifiers — no manual math | Core value prop; if user must do math, the tool failed | MEDIUM | JSON import provides the numbers; need to apply them correctly |
| Attack + damage roll together | Attacks always produce both; separating them is friction | LOW | Roll d20 attack, show damage roll in same result card |
| Degree of success display (critical success / failure / success / failure) | PF2e players expect this; Foundry does it; Pathbuilder doesn't — it's a known gap they resent | MEDIUM | Requires DC input from user; then compare roll total vs DC |
| Natural 20 / natural 1 shifts degree of success | Core PF2e rule; missing it would produce wrong results | LOW | Apply after degree calculation |
| Roll result card showing labeled modifier breakdown | Foundry sets this expectation; knowing why you got 23 matters | MEDIUM | Store modifier sources from character data; display per roll |
| Saving throw rolls (Fort, Ref, Will) | Character sheets have saves; obvious click targets | LOW | Same pattern as skill rolls |
| Perception and Initiative rolls | Always used at session start; must be one-tap | LOW | Same pattern as skill rolls |
| Free-form dice expression (3d6+2, 2d8dh, etc.) | Every dice tool has this; feels broken without it | MEDIUM | Dice expression parser; Foundry syntax is the reference |
| Roll history / audit log | D&D Beyond has Game Log; users expect to scroll back | MEDIUM | Scrollable in-session list; need timestamps, roll labels |
| Import from Pathbuilder JSON | Primary stated use case; most PF2e players use Pathbuilder | HIGH | JSON schema must be reverse-engineered from sample files |
| Import from Foundry VTT JSON | Secondary use case; Foundry users export easily | HIGH | Different JSON schema; same parsing pipeline target |
| Responsive — works on phone | Players roll at table on their phones | MEDIUM | Mobile-first layout with large tap targets |
| Works offline (PWA) | Rolling at table with spotty wifi; D&D Beyond fails here | MEDIUM | Service worker caching; IndexedDB for all data |

---

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Multiple Attack Penalty UI — select 1st/2nd/3rd attack before rolling | Pathbuilder has no MAP UI; users must track manually; this is friction at every combat turn | MEDIUM | Toggle (1st / 2nd / 3rd attack) stored per session; subtract 0/-5/-10 (or 0/-4/-8 agile) from attack roll |
| Hero Point reroll button on roll result | Pathbuilder lacks this; Foundry has it but requires GM setup; huge moment of delight for players | LOW | Show "Spend Hero Point" button on failed d20 roll; re-roll and use new result; track hero point count |
| Check Prompt — GM creates "roll Perception DC 20" button | Foundry has this via modules; Pathbuilder doesn't; GMs desperately want it | HIGH | GM enters skill, DC, prompt text; generates a shareable link or in-app notification |
| DC entry on roll — auto-compute degree of success | Foundry does this; Pathbuilder doesn't — users must compute in head | LOW | Input field on check card; or pre-set DC on check prompt; compare vs roll total |
| Status/circumstance/item bonus toggles | Pathbuilder pre-bakes sheet values; situational bonuses (flanking, heroism, etc.) have no home | MEDIUM | Per-roll overlay: "+2 circumstance (flanking)", "+1 status (inspire courage)"; stacking rules enforced by type |
| Foundry-style check prompt dialog (title, DC types, difficulty adjustment, success step) | Power-users from Foundry expect this; replicating it makes transition seamless | HIGH | Pre-roll dialog: DC mode (flat/simple/level-based), difficulty offset (easy/hard), degree-shift options |
| GM mode — load multiple NPCs/characters simultaneously | No other standalone tool does multi-character for GM | HIGH | Character switcher; per-character roll history; NPC stat blocks |
| Session-tagged roll history with export | GMs want verifiable roll records; nobody else provides export | MEDIUM | Tag rolls by session ID + timestamp; JSON/CSV export |
| Three switchable themes (parchment / Pathfinder brand / modern) | Community aesthetic diversity; Pathbuilder has one look; D&D Beyond is D&D-branded | MEDIUM | CSS custom properties; theme switcher in settings |
| Feat effect integration — auto-apply mechanical feat bonuses | If Furious Focus feat removes MAP on Power Attack, no other standalone tool knows that | HIGH | Parse feat rule text or flag from JSON; apply conditionally; manual override for unknowns |
| Installable PWA — works offline, feels native | D&D Beyond requires internet; Pathbuilder requires internet; this wins at the table | MEDIUM | Service worker + manifest; IndexedDB persistence |

---

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time multiplayer / shared rolling | D&D Beyond does it; players want to "see each other roll" | Requires a server/backend or WebRTC; violates client-side-only constraint; adds auth complexity; out of scope per PROJECT.md | Exportable roll history satisfies the trust/verification need; shareable session logs |
| Built-in feat/spell database | Auto-apply any feat effect without JSON data | Would require maintaining parity with Paizo releases; licensing issues with reproducing rule text; perpetual maintenance burden per PROJECT.md | Manual feat override system: user describes the bonus, tool applies it |
| Character sheet editing | Natural extension of an imported sheet | Turns the tool into a character builder; scope explosion; competes with Pathbuilder at what Pathbuilder does better | Keep import-only; link back to Pathbuilder/Foundry for editing |
| User accounts / cloud sync | Roll history accessible across devices | Requires a server, auth, data storage — violates GitHub Pages constraint | IndexedDB for local persistence; JSON export/import for migration |
| Automated condition tracking | Conditions (frightened, clumsy, etc.) auto-modify rolls | Requires tracking game state; who applied conditions and when; conditions have durations; this becomes a combat tracker | Status bonus overlay lets user manually add active bonuses before rolling; lightweight and correct |
| Full combat tracker / initiative order | Natural extension of rolling | Scope explosion into VTT territory; Foundry does this better with a full server | Initiative roll is supported; GM tracks order elsewhere |
| Homebrew rules support | Tables have house rules | Infinite scope; can't anticipate all variants; testing becomes impossible | PF2e RAW only; arbitrary dice roller + manual override handles edge cases |

---

## Feature Dependencies

```
Character Import (Foundry JSON / Pathbuilder JSON)
    └──requires──> JSON Schema Parser
                       └──enables──> All character-derived rolls
                                         (skills, saves, attacks, spells, perception, initiative)

Degree of Success Display
    └──requires──> DC Entry (per roll OR pre-set on check prompt)
    └──requires──> Character Roll Result

Check Prompt (GM-created)
    └──requires──> DC Entry
    └──requires──> Roll Type Selection
    └──enhances──> Degree of Success Display (DC travels with prompt)

MAP UI (1st/2nd/3rd attack toggle)
    └──requires──> Attack Roll
    └──requires──> Agile weapon detection (from character data)

Hero Point Reroll
    └──requires──> Roll Result Card
    └──requires──> Hero Point counter (per character)

Status/Circumstance Bonus Overlay
    └──requires──> Roll Context (which check type)
    └──enhances──> Any roll (stacks correctly by bonus type)

Roll History / Audit Log
    └──requires──> Roll Result (every roll appends)
    └──requires──> Session tagging
    └──enhances──> Export feature

GM Mode (multi-character)
    └──requires──> Character Import (multiple)
    └──requires──> Character switcher UI
    └──enhances──> Check Prompt (sent from GM to players)

Feat Effect Integration
    └──requires──> Character Import (feat list from JSON)
    └──enhances──> Attack rolls, skill rolls, saves (conditionally)
    └──conflicts──> Homebrew rules (anti-feature: don't support)

PWA / Offline
    └──requires──> Service Worker
    └──requires──> IndexedDB (all state local)
    └──enables──> Character data persistence across sessions
```

### Dependency Notes

- **All character rolls require JSON import:** Without at least one imported character, there's nothing to roll from. JSON import is the root dependency of the entire product.
- **Degree of success requires DC:** The DoS display is useless without knowing the DC. DC entry must exist on the roll card or be pre-set via check prompt.
- **MAP requires agile detection:** Agile weapons use -4/-8 penalty; if the weapon's agile trait isn't read from JSON, MAP is silently wrong. This makes the weapon parsing fidelity critical.
- **Feat effects conflict with homebrew:** Feat parsing is inherently PF2e-RAW dependent. Trying to support both is contradictory.
- **GM Mode enhances check prompts:** The killer GM feature is sending a check prompt to a specific player's character. This requires GM Mode to know which character belongs to which session.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Foundry VTT JSON import — primary power-user import path; richest data
- [ ] Pathbuilder JSON import — broadest community reach; most PF2e players
- [ ] Click-to-roll: skills, saves, perception, initiative — daily driver rolls
- [ ] Click-to-roll: attacks with damage — combat core
- [ ] Click-to-roll: spells (attack roll + damage display) — required for casters
- [ ] Modifier breakdown on roll card (labeled: proficiency, ability, status, etc.) — differentiates from "just a d20 roller"
- [ ] DC entry + degree of success display (crit success / success / failure / crit fail) — the PF2e-specific win
- [ ] Natural 20 / natural 1 degree shift — correctness requirement
- [ ] Multiple Attack Penalty UI (1st/2nd/3rd, agile-aware) — biggest Pathbuilder gap
- [ ] Hero Point reroll button on failure — beloved PF2e mechanic, low complexity
- [ ] Free-form dice expression roller — needed for edge cases, expected baseline
- [ ] Roll history (session-scoped, scrollable) — bare minimum for trust/audit
- [ ] IndexedDB persistence — characters survive page reload
- [ ] PWA manifest + service worker — offline capability, installable
- [ ] Responsive design (phone-first) — table use case requires it
- [ ] Single theme (parchment or modern) — themes are polish, not core

### Add After Validation (v1.x)

Features to add once core is working and users confirm direction.

- [ ] Status/circumstance/item bonus overlay per roll — add when users ask "how do I add flanking bonus?"
- [ ] Check Prompt (GM creates roll request) — add when GM users report friction around requesting rolls
- [ ] GM Mode (multi-character switcher) — add when GMs adopt the tool and need NPC support
- [ ] Session-tagged export (JSON/CSV) — add when trust/verification becomes a user complaint
- [ ] Foundry-style check prompt dialog (full: DC type, difficulty offset, degree shift) — add when basic DC entry proves insufficient
- [ ] Remaining two themes (Pathfinder brand + modern if parchment first, or vice versa) — add after core UX is validated

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Feat effect auto-parsing — defer: high complexity, high maintenance, can ship with manual override as MVP; validate demand first
- [ ] Check Prompt sharing via URL — defer: needs careful design to work client-side-only
- [ ] Dice syntax: exploding dice, counted successes — defer: PF2e rarely uses these; address when requested

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| JSON import (Foundry + Pathbuilder) | HIGH | HIGH | P1 |
| Click-to-roll all character checks | HIGH | MEDIUM | P1 |
| DC entry + degree of success | HIGH | LOW | P1 |
| Multiple Attack Penalty UI | HIGH | MEDIUM | P1 |
| Modifier breakdown on roll card | HIGH | MEDIUM | P1 |
| Natural 20/1 degree shift | HIGH | LOW | P1 |
| Hero Point reroll | HIGH | LOW | P1 |
| Roll history (session) | HIGH | MEDIUM | P1 |
| Free-form dice roller | MEDIUM | MEDIUM | P1 |
| PWA / offline | HIGH | MEDIUM | P1 |
| Responsive mobile layout | HIGH | MEDIUM | P1 |
| Status bonus overlay | MEDIUM | MEDIUM | P2 |
| Check Prompt (GM-initiated) | HIGH | HIGH | P2 |
| GM Mode (multi-character) | MEDIUM | HIGH | P2 |
| Session export | MEDIUM | LOW | P2 |
| Foundry-style full check dialog | MEDIUM | HIGH | P2 |
| Additional themes | LOW | MEDIUM | P2 |
| Feat effect auto-parsing | HIGH | HIGH | P3 |
| Dice syntax extended (exploding, etc.) | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | D&D Beyond | Pathbuilder 2e | Foundry VTT PF2e | Our Approach |
|---------|------------|----------------|------------------|--------------|
| Click-to-roll from sheet | Yes | Yes | Yes | Yes (P1) |
| Pre-calculated modifiers | Yes (5e) | Yes (PF2e) | Yes (PF2e) | Yes, from JSON import |
| Degree of success (4 levels) | No (5e binary) | No (not displayed) | Yes | Yes + auto-compute from DC |
| Natural 20/1 degree shift | No | No | Yes | Yes |
| DC entry on roll | No | No | Yes (check dialog) | Yes (inline input on card) |
| Modifier breakdown labeled | Partial | No | Yes | Yes |
| MAP UI | No | No | Yes (auto-tracked) | Yes (manual toggle, agile-aware) |
| Hero Point reroll | No | No | Yes (right-click) | Yes (button on card) |
| Status/circumstance bonus | No | No | Yes (conditions auto-applied) | Yes (manual overlay toggles) |
| Roll history / log | Yes (Game Log) | No | Yes (chat) | Yes (session-scoped IndexedDB) |
| Roll export | No | No | No | Yes (JSON/CSV) |
| GM roll prompts | No | No | Yes (core + modules) | Yes (P2) |
| GM multi-character mode | DM tools (limited) | No | Yes (actor list) | Yes (P2) |
| Free-form dice roller | Yes | No | Yes (chat command) | Yes |
| Offline / PWA | No | No | No | Yes |
| Feat effect automation | N/A | No | Yes (rule elements) | Manual override (P1), auto-parse (P3) |
| Character import from JSON | No | Export only | Import/export | Yes (both Foundry + Pathbuilder JSON) |
| 3D animated dice | Yes | Via extension | Via module | No (anti-feature: complexity vs. value) |
| Multiplayer shared rolls | Yes (campaign) | Via extension | Yes (VTT native) | No (out of scope) |
| Themes | 1 (D&D brand) | 1 | 1 | 3 switchable |

---

## Sources

- [D&D Beyond: Share Your Dice Results with the Brand New Game Log](https://www.dndbeyond.com/posts/939-share-your-dice-results-with-the-brand-new-game)
- [D&D Beyond Digital Dice Support Article](https://dndbeyond-support.wizards.com/hc/en-us/articles/7747201888404-Digital-Dice-How-to-roll-your-free-or-premium-Digital-Dice)
- [D&D Beyond 2025 Wrap-Up](https://www.dndbeyond.com/posts/2116-d-d-beyond-2025-wrap-up)
- [Foundry VTT — Basic Dice](https://foundryvtt.com/article/dice/)
- [Foundry VTT — Dice Modifiers](https://foundryvtt.com/article/dice-modifiers/)
- [Foundry PF2e System Package Page](https://foundryvtt.com/packages/pf2e)
- [Foundry PF2e GM Starter Guide (GitHub Wiki)](https://github.com/foundryvtt/pf2e/wiki/GM's-Starter-Guide)
- [Foundry PF2e — Rule Elements Quickstart (GitHub Wiki)](https://github.com/foundryvtt/pf2e/wiki/Quickstart-guide-for-rule-elements)
- [Foundry PF2e Issue #10244 — GM check prompts (resolved)](https://github.com/foundryvtt/pf2e/issues/10244)
- [PF2e Roll Manager Module](https://foundryvtt.com/packages/pf2e-roll-manager)
- [PF2e Modifiers Matter Module](https://github.com/shemetz/pf2e-modifiers-matter)
- [Pathbuilder 2e — App Page](https://pathbuilder2e.com/app.html)
- [Pathbuilder 2e — dddice Integration](https://docs.dddice.com/docs/integrations/pathbuilder-2e/)
- [Pathbuilder 2e GitLab Issue #1676 — Roll log request](https://gitlab.com/doctor.unspeakable/pathbuilder-2e/-/issues/1676)
- [PF2e Degree of Success Rules — Archives of Nethys](https://2e.aonprd.com/Rules.aspx?ID=2286&Redirected=1)
- [PF2e Hero Points — Archives of Nethys](https://2e.aonprd.com/Rules.aspx?ID=2333&Redirected=1)
- [Path to Roll Chrome Extension](https://chromewebstore.google.com/detail/path-to-roll/omblhjccfogjeedomkjbmmmogggphflh)

---
*Feature research for: PF2e character-sheet-integrated dice roller PWA*
*Researched: 2026-03-14*
