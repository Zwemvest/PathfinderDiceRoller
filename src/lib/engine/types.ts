// ─── Engine types — Phase 3 Plan 01 ─────────────────────────────────────────
// Pure types consumed by degree.ts, modifiers.ts, and presets.ts.
// No side effects, no imports.

// ─── Degree of success ────────────────────────────────────────────────────────

/** Four-tier degree scale matching PF2e RAW and Foundry token naming */
export type DegreeOfSuccess =
  | 'critical-success'
  | 'success'
  | 'failure'
  | 'critical-failure';

/** Result returned by computeDegree() */
export interface DegreeResult {
  /** Final degree after any nat 20/1 shift */
  degree: DegreeOfSuccess;
  /** Base degree before nat shift (same as degree when shifted=false) */
  baseDegree: DegreeOfSuccess;
  /** Whether a nat 20/1 shift actually changed the outcome */
  shifted: boolean;
  /** Which direction the shift went, or undefined when shifted=false */
  shiftDirection?: 'up' | 'down';
}

// ─── Modifier types ───────────────────────────────────────────────────────────

/** PF2e bonus/penalty categories — typed ones do not fully stack */
export type ModifierType = 'status' | 'circumstance' | 'item' | 'untyped';

/** A single modifier toggle (bonus or penalty) */
export interface ModifierEntry {
  /** Stable unique identifier */
  id: string;
  /** Human-readable label shown in the UI */
  label: string;
  /** Modifier category — determines stacking behaviour */
  type: ModifierType;
  /** Signed integer; negative values are penalties */
  value: number;
  /** Whether this modifier is currently active */
  enabled: boolean;
}

/** Per-type subtotals included in ResolvedModifiers */
export interface ModifierBreakdown {
  status: number;
  circumstance: number;
  item: number;
  untyped: number;
}

/** Return value of resolveModifiers() */
export interface ResolvedModifiers {
  /** Net modifier after stacking rules applied */
  total: number;
  /** Entries that actually contributed to total */
  kept: ModifierEntry[];
  /** Per-type subtotals from kept entries */
  breakdown: ModifierBreakdown;
}
