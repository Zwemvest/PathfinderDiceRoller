# Pathfinder 2e Dice Roller

## What This Is

A full-featured, client-side dice roller for Pathfinder 2nd Edition that imports character sheets from Foundry VTT and Pathbuilder JSON exports. It provides click-to-roll functionality for all character actions — skills, attacks, spells, saves, perception, initiative — with full PF2e rules integration including feat effects, multiple attack penalty, and Foundry-style check prompts. Built as a PWA hosted on GitHub Pages, designed for both players (single character) and GMs (multiple NPCs).

## Core Value

Players and GMs can import their PF2e characters and roll any check with one tap, with correct modifiers applied automatically — no manual math, no missed bonuses.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Import character sheets from Foundry VTT JSON exports
- [ ] Import character sheets from Pathbuilder JSON exports
- [ ] Click-to-roll skills with correct modifiers
- [ ] Click-to-roll attacks with automatic attack and damage rolls
- [ ] Click-to-roll spells (attack rolls for spell attacks, damage always shown)
- [ ] Click-to-roll perception and initiative
- [ ] Click-to-roll saving throws
- [ ] Multiple Attack Penalty — select which attack in the round
- [ ] Roll damage on GM-confirmed hits
- [ ] Open dice roller with arbitrary dice selection
- [ ] Status/circumstance/item bonus and penalty support
- [ ] Advantage/disadvantage, drop highest/lowest support
- [ ] Dice syntax parsing (e.g., 3d6dh, 2d8+5)
- [ ] DC entry with automatic result calculation (critical failure/failure/success/critical success)
- [ ] Foundry-style check prompt (title, DC types, difficulty adjustment, success step adjustment, skill/perception selection)
- [ ] Check prompts usable by both GM and players
- [ ] Full feat effect integration — parse and apply feat mechanical effects from character data
- [ ] Manual override for feats that can't be auto-parsed
- [ ] Hero point reroll on d20 failures
- [ ] Scrollable, searchable audit log of all rolls
- [ ] Session-tagged roll history with timestamps
- [ ] Exportable roll history (GM-verifiable)
- [ ] GM mode — load and switch between multiple NPC/character sheets
- [ ] Player mode — single character focus
- [ ] Three switchable UI themes (parchment/fantasy, Pathfinder brand red/gold/dark, sleek modern)
- [ ] Responsive design — works on phone, tablet, and desktop
- [ ] PWA — installable, works offline
- [ ] GitHub Pages hosting — fully client-side, no server
- [ ] IndexedDB persistence for character data, settings, and roll history
- [ ] Feature parity with D&D Beyond dice roller (where applicable to PF2e)
- [ ] Feature parity with Pathbuilder dice roller
- [ ] Feature parity with Foundry VTT dice roller

### Out of Scope

- Server-side components or user accounts — fully client-side by design
- Real-time multiplayer/shared rolling — each device runs independently
- Character sheet editing — this is a roller, not a character builder
- Homebrew rule systems — PF2e RAW only
- Automated feat database that ships with the app — use manual overrides for unknown feats instead of maintaining a database

## Context

- Target audience starts as the developer's own table, but designed for public use by the broader PF2e community
- Foundry VTT and Pathbuilder both export character data as JSON — these are the import formats
- Foundry JSON contains detailed character data including feats, items, spells, and modifiers
- Pathbuilder JSON exports contain feat names but may lack full mechanical effect descriptions
- PF2e has a specific critical success/failure system: beat DC by 10+ = crit success, fail by 10+ = crit failure, natural 20/1 shift result one step
- Multiple Attack Penalty (MAP) is -5/-10 by default, modified by agile weapons (-4/-8)
- The "check prompt" concept from Foundry allows setting DC by number, simple DC table, or level-based DC, with difficulty adjustments and success step modifications
- Feature parity research against D&D Beyond, Pathbuilder, and Foundry rollers should inform the final feature set
- Included in the repo are sample Foundry and Pathbuilder character sheet JSON files for development reference

## Constraints

- **Hosting**: GitHub Pages only — no server, no backend, no database
- **Storage**: IndexedDB for all persistence (characters, settings, history)
- **Offline**: Must work offline as a PWA after initial load
- **Client-side**: All logic runs in browser — no API calls for core functionality
- **Licensing**: Cannot ship Paizo's rules content (feat descriptions, spell text) — only reference what's in the character export data

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Manual feat overrides over built-in database | Avoids maintenance burden of tracking PF2e updates; user knows their character best | — Pending |
| Three switchable themes | Different users prefer different aesthetics; supports broad community adoption | — Pending |
| GM + Player dual mode | Supports both use cases without separate apps | — Pending |
| JSON import (not API/URL) | Simplest approach, no CORS issues, works offline, respects both platforms | — Pending |
| IndexedDB for persistence | Largest client-side storage option, structured data support, good browser support | — Pending |

---
*Last updated: 2026-03-14 after initialization*
