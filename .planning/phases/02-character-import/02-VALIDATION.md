---
phase: 2
slug: character-import
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (configured in Phase 1) |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --project unit --reporter=dot` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --project unit --reporter=dot`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | IMPT-01 | unit | `npx vitest run --project unit src/lib/parsers/foundry.unit.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | IMPT-02 | unit | `npx vitest run --project unit src/lib/parsers/pathbuilder.unit.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | IMPT-03 | browser | `npx vitest run --project browser src/lib/db/character.browser.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | IMPT-04 | browser | `npx vitest run --project browser src/lib/db/character.browser.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 2 | IMPT-05 | browser | `npx vitest run --project browser src/lib/db/character.browser.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/parsers/types.ts` — NormalizedCharacter interface (used by all tests)
- [ ] `src/lib/parsers/foundry.unit.test.ts` — covers IMPT-01 (Foundry parser correctness for all 4 samples)
- [ ] `src/lib/parsers/pathbuilder.unit.test.ts` — covers IMPT-02 (Pathbuilder parser correctness for Kairos)
- [ ] `src/lib/db/character.browser.test.ts` — covers IMPT-03, IMPT-04, IMPT-05 (persistence, delete, re-import)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| File picker and drag-drop work on mobile | IMPT-01/02 | Native file dialog requires user interaction | Open on phone > tap Import > pick JSON file > verify character loads |
| Confirmation card displays correctly | IMPT-01/02 | Visual verification | Import a character > verify name/class/level shown in confirmation |
| Re-import shows change summary | IMPT-05 | Visual verification | Re-import updated JSON > verify changes listed before confirm |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
