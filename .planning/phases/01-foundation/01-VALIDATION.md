---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (browser mode) + Playwright |
| **Config file** | `vitest.config.ts` — Wave 0 creates this |
| **Quick run command** | `npx vitest run --project browser --reporter=dot` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --project browser --reporter=dot`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | PLAT-01 | smoke | `npm run build && test -f build/index.html` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | PLAT-02 | smoke | `test -f build/manifest.webmanifest && test -f build/sw.js` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | PLAT-03 | browser | `npx vitest run --project browser src/lib/db/db.browser.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | PLAT-04 | browser | `npx vitest run --project browser src/lib/components/layout/layout.browser.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 1 | PLAT-05 | browser | `npx vitest run --project browser src/lib/db/db.browser.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — browser mode + unit mode project split
- [ ] `vitest-setup-browser.ts` — `@vitest/browser/matchers` type reference
- [ ] `src/lib/db/db.browser.test.ts` — covers PLAT-03, PLAT-05 (Dexie persistence + SW cache check)
- [ ] `src/lib/components/layout/layout.browser.test.ts` — covers PLAT-04 (responsive layout)
- [ ] Framework install: `npx playwright install chromium` — required for browser provider

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App installable as PWA from browser | PLAT-02 | Browser install prompt requires user interaction | Open in Chrome mobile > Menu > "Install app" > Verify icon appears on home screen |
| GitHub Actions deploys on push to main | PLAT-01 | CI pipeline requires actual git push | Push a commit to main, verify GitHub Actions runs and Pages URL updates |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
