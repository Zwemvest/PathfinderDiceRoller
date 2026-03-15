import type { ModifierEntry, ModifierType, ResolvedModifiers } from './types';

// ─── Modifier stacking — PF2e RAW ─────────────────────────────────────────────
// Source: Archives of Nethys — https://2e.aonprd.com/Rules.aspx?ID=22
//
// Rules:
//   • Typed bonuses (status, circumstance, item): only the HIGHEST bonus applies.
//   • Typed penalties: only the WORST (most negative) applies.
//   • Untyped: ALL stack unconditionally.

const TYPED_CATEGORIES: readonly ModifierType[] = ['status', 'circumstance', 'item'] as const;

/**
 * Collapse a list of ModifierEntry toggles into a net modifier using PF2e stacking rules.
 * Disabled entries are ignored entirely.
 */
export function resolveModifiers(entries: ModifierEntry[]): ResolvedModifiers {
  const active = entries.filter((e) => e.enabled);
  const kept: ModifierEntry[] = [];

  // Handle typed categories: keep best bonus + worst penalty per type
  for (const type of TYPED_CATEGORIES) {
    const ofType = active.filter((e) => e.type === type);
    const bonuses = ofType.filter((e) => e.value > 0);
    const penalties = ofType.filter((e) => e.value < 0);

    if (bonuses.length > 0) {
      const best = bonuses.reduce((a, b) => (a.value >= b.value ? a : b));
      kept.push(best);
    }
    if (penalties.length > 0) {
      const worst = penalties.reduce((a, b) => (a.value <= b.value ? a : b));
      kept.push(worst);
    }
  }

  // Untyped: all stack unconditionally (both bonuses and penalties)
  const untyped = active.filter((e) => e.type === 'untyped');
  kept.push(...untyped);

  const total = kept.reduce((sum, e) => sum + e.value, 0);
  const breakdown = {
    status: kept.filter((e) => e.type === 'status').reduce((s, e) => s + e.value, 0),
    circumstance: kept.filter((e) => e.type === 'circumstance').reduce((s, e) => s + e.value, 0),
    item: kept.filter((e) => e.type === 'item').reduce((s, e) => s + e.value, 0),
    untyped: kept.filter((e) => e.type === 'untyped').reduce((s, e) => s + e.value, 0),
  };

  return { total, kept, breakdown };
}
