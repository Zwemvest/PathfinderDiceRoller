---
phase: 4
slug: core-rolling
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (browser + unit projects) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=dot` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=dot`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | HIST-01..04 | browser | `npx vitest run --project browser src/lib/db/roll.browser.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | ROLL-01..05 | browser | `npx vitest run --project browser src/lib/components/rolling/` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | DICE-01..05 | browser | `npx vitest run --project browser src/lib/components/rolling/DiceTray.browser.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/db/roll.browser.test.ts` — covers HIST-01..04 (saveRoll, getRollHistory, clear, auto-prune at 100)
- [ ] `src/lib/components/rolling/PreRollDialog.browser.test.ts` — covers ROLL-01..04
- [ ] `src/lib/components/rolling/RollResultCard.browser.test.ts` — covers ROLL-05
- [ ] `src/lib/components/rolling/DiceTray.browser.test.ts` — covers DICE-01..05

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Roll result card visual (colors, layout) | ROLL-05 | Visual verification | Roll a skill with DC set, verify gold/green/orange/red badge + modifier breakdown |
| Dice tray collapse/expand animation | DICE-01 | Animation smoothness | Tap dice tray bar, verify smooth expand, type expression, roll |
| History scroll direction | HIST-01 | UX feel | Open History tab, verify newest rolls at bottom, scroll up for older |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
