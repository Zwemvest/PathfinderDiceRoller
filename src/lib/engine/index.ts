// ─── Engine barrel export — Phase 3 Plan 02 ──────────────────────────────────
// Single import point for all engine consumers (Phases 4–7):
//   import { computeDegree, resolveModifiers, rollExpression, computeMAP } from '$lib/engine'

// Types
export type {
  DegreeOfSuccess,
  DegreeResult,
  ModifierType,
  ModifierEntry,
  ResolvedModifiers,
} from './types';

// Degree of success
export { computeDegree, DEGREE_COLORS } from './degree';

// Modifiers
export { resolveModifiers } from './modifiers';
export { PRESET_MODIFIERS } from './presets';

// Dice
export { rollExpression, configureEngine } from './dice';
export type { DiceRollResult } from './dice';

// MAP
export { computeMAP } from './map';
