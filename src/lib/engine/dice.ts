// ─── Dice expression roller — Phase 3 Plan 02 ────────────────────────────────
// Wraps @dice-roller/rpg-dice-roller with a configurable RNG engine.
// Default engine: browserCrypto (uses window.crypto.getRandomValues).
// Tests override via configureEngine(NumberGenerator.engines.nativeMath).
//
// Source: https://dice-roller.github.io/documentation/guide/customisation.html

import { DiceRoll, NumberGenerator } from '@dice-roller/rpg-dice-roller';

// Set default RNG engine at module init.
// Overridden in unit tests (node env lacks window.crypto).
NumberGenerator.generator.engine = NumberGenerator.engines.browserCrypto;

/**
 * Swap the RNG engine used by all DiceRoll instances.
 * Call with nativeMath in unit tests, browserCrypto in production.
 */
export function configureEngine(engine: typeof NumberGenerator.generator.engine): void {
  NumberGenerator.generator.engine = engine;
}

/** Structured result of a single dice roll expression evaluation */
export interface DiceRollResult {
  /** The original notation, e.g. "1d20+15" */
  notation: string;
  /** Final total after all arithmetic in the expression */
  total: number;
  /** Raw face values of each die rolled (before arithmetic) */
  dieResults: number[];
  /** First die face value — for d20 rolls this is the nat 20/1 detection value */
  naturalDie: number;
  /** Human-readable output string, e.g. "[17]+15 = 32" */
  output: string;
}

/**
 * Roll a dice expression and return a structured result.
 * Throws if the notation is invalid (delegates to DiceRoll's built-in validation).
 *
 * @param notation - Standard dice notation, e.g. "1d20+15", "2d6+4", "1d8"
 */
export function rollExpression(notation: string): DiceRollResult {
  const roll = new DiceRoll(notation);

  // Extract individual die face values from the nested roll structure.
  // roll.rolls is Array<ResultGroup | RollResults | string | number>.
  // RollResults objects have a 'rolls' property containing RollResult items
  // with an 'initialValue' field (the raw die face before any modifier).
  const dieResults: number[] = [];
  for (const group of roll.rolls) {
    if (group && typeof group === 'object' && 'rolls' in group) {
      const rollResults = (group as { rolls: Array<{ initialValue: number }> }).rolls;
      for (const r of rollResults) {
        dieResults.push(r.initialValue);
      }
    }
  }

  // For a 1d20+M roll, dieResults[0] is the raw d20 face (1–20).
  // Used by computeDegree for nat 20/1 shift detection.
  const naturalDie = dieResults.length > 0 ? dieResults[0] : 0;

  return {
    notation: roll.notation,
    total: roll.total,
    dieResults,
    naturalDie,
    output: roll.output,
  };
}
