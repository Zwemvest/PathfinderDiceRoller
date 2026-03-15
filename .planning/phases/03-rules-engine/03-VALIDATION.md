---
phase: 3
slug: rules-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (unit project — node environment) |
| **Config file** | `vitest.config.ts` (already exists) |
| **Quick run command** | `npx vitest run --project unit --reporter=dot` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --project unit --reporter=dot`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | DGRN-01..05 | unit | `npx vitest run --project unit src/lib/engine/degree.unit.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | MODF-01..05 | unit | `npx vitest run --project unit src/lib/engine/modifiers.unit.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | - | unit | `npx vitest run --project unit src/lib/engine/dice.unit.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | - | unit | `npx vitest run --project unit src/lib/engine/map.unit.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/engine/degree.unit.test.ts` — covers DGRN-01 through DGRN-05
- [ ] `src/lib/engine/modifiers.unit.test.ts` — covers MODF-01 through MODF-05
- [ ] `src/lib/engine/dice.unit.test.ts` — covers dice rolling + naturalDie extraction
- [ ] `src/lib/engine/map.unit.test.ts` — covers agile and standard MAP
- No new framework install needed — Vitest unit project already configured

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Degree of success color coding visually distinct | DGRN-05 | Visual verification | Roll with DC set, verify gold/green/orange/red colors appear correctly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
