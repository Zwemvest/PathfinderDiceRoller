import { beforeAll, describe, it, expect } from 'vitest';
import { NumberGenerator } from '@dice-roller/rpg-dice-roller';
import { rollExpression, configureEngine } from './dice';

// CRITICAL: browserCrypto uses window.crypto which is unavailable in node env.
// Override to nativeMath for unit tests.
beforeAll(() => {
  configureEngine(NumberGenerator.engines.nativeMath);
});

describe('rollExpression — structure', () => {
  it('1d20+15: returns notation, numeric total, dieResults with 1 element, naturalDie', () => {
    const result = rollExpression('1d20+15');
    expect(result.notation).toBe('1d20+15');
    expect(typeof result.total).toBe('number');
    expect(result.dieResults).toHaveLength(1);
    expect(typeof result.naturalDie).toBe('number');
    expect(typeof result.output).toBe('string');
  });

  it('1d20+15: total in range [16, 35]', () => {
    const result = rollExpression('1d20+15');
    expect(result.total).toBeGreaterThanOrEqual(16);
    expect(result.total).toBeLessThanOrEqual(35);
  });

  it('1d20+15: dieResults[0] is between 1 and 20', () => {
    const result = rollExpression('1d20+15');
    expect(result.dieResults[0]).toBeGreaterThanOrEqual(1);
    expect(result.dieResults[0]).toBeLessThanOrEqual(20);
  });

  it('1d20+15: naturalDie matches dieResults[0]', () => {
    const result = rollExpression('1d20+15');
    expect(result.naturalDie).toBe(result.dieResults[0]);
  });
});

describe('rollExpression — 1d20 basic', () => {
  it('1d20: naturalDie between 1 and 20', () => {
    const result = rollExpression('1d20');
    expect(result.naturalDie).toBeGreaterThanOrEqual(1);
    expect(result.naturalDie).toBeLessThanOrEqual(20);
  });
});

describe('rollExpression — 2d6+4', () => {
  it('2d6+4: total in range [6, 16]', () => {
    const result = rollExpression('2d6+4');
    expect(result.total).toBeGreaterThanOrEqual(6);
    expect(result.total).toBeLessThanOrEqual(16);
  });

  it('2d6+4: dieResults has 2 elements', () => {
    const result = rollExpression('2d6+4');
    expect(result.dieResults).toHaveLength(2);
  });

  it('2d6+4: each dieResult is between 1 and 6', () => {
    const result = rollExpression('2d6+4');
    for (const v of result.dieResults) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
    }
  });
});

describe('rollExpression — 1d8', () => {
  it('1d8: total between 1 and 8', () => {
    const result = rollExpression('1d8');
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result.total).toBeLessThanOrEqual(8);
  });
});

describe('rollExpression — invalid notation', () => {
  it('invalid notation throws an error', () => {
    expect(() => rollExpression('invalid!@#')).toThrow();
  });
});
