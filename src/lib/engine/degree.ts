import type { DegreeOfSuccess, DegreeResult } from './types';

// ─── Degree order (index maps to shift arithmetic) ────────────────────────────

const DEGREE_ORDER: readonly DegreeOfSuccess[] = [
  'critical-failure',
  'failure',
  'success',
  'critical-success',
] as const;

// ─── Internal shift helpers ───────────────────────────────────────────────────

function shiftUp(d: DegreeOfSuccess): DegreeOfSuccess {
  const idx = DEGREE_ORDER.indexOf(d);
  return DEGREE_ORDER[Math.min(idx + 1, DEGREE_ORDER.length - 1)];
}

function shiftDown(d: DegreeOfSuccess): DegreeOfSuccess {
  const idx = DEGREE_ORDER.indexOf(d);
  return DEGREE_ORDER[Math.max(idx - 1, 0)];
}

// ─── Base degree ──────────────────────────────────────────────────────────────

function baseDegreeFromNumbers(total: number, dc: number): DegreeOfSuccess {
  const diff = total - dc;
  if (diff >= 10) return 'critical-success';
  if (diff >= 0) return 'success';
  if (diff >= -9) return 'failure';
  return 'critical-failure';
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Compute the PF2e degree of success.
 *
 * RAW order-of-operations:
 *   1. Determine base degree from (total vs DC).
 *   2. Apply nat 20/1 shift AFTER the base degree is known.
 *
 * @param total    - The final roll total (die result + modifiers)
 * @param dc       - The Difficulty Class being checked against
 * @param dieValue - The raw d20 face (1–20), used only to detect nat 20/1
 */
export function computeDegree(total: number, dc: number, dieValue: number): DegreeResult {
  const baseDegree = baseDegreeFromNumbers(total, dc);

  if (dieValue === 20) {
    const shifted = shiftUp(baseDegree);
    if (shifted === baseDegree) {
      // Already at the ceiling — nat 20 has no effect
      return { degree: baseDegree, baseDegree, shifted: false };
    }
    return { degree: shifted, baseDegree, shifted: true, shiftDirection: 'up' };
  }

  if (dieValue === 1) {
    const shifted = shiftDown(baseDegree);
    if (shifted === baseDegree) {
      // Already at the floor — nat 1 has no effect
      return { degree: baseDegree, baseDegree, shifted: false };
    }
    return { degree: shifted, baseDegree, shifted: true, shiftDirection: 'down' };
  }

  return { degree: baseDegree, baseDegree, shifted: false };
}

// ─── Foundry-style color map ──────────────────────────────────────────────────

/** Maps each degree of success to a Foundry-compatible hex color */
export const DEGREE_COLORS: Record<DegreeOfSuccess, string> = {
  'critical-success': '#FFD700', // gold
  'success': '#00C853',          // green
  'failure': '#FF6D00',          // orange
  'critical-failure': '#D50000', // red
};
