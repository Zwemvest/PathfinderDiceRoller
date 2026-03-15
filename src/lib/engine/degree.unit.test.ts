import { describe, it, expect } from 'vitest';
import { computeDegree, DEGREE_COLORS } from './degree';
import type { DegreeOfSuccess } from './types';

describe('computeDegree — base degrees (no nat shift)', () => {
  it('beats DC by 10+: critical-success, shifted=false', () => {
    const result = computeDegree(25, 15, 7);
    expect(result.degree).toBe('critical-success');
    expect(result.baseDegree).toBe('critical-success');
    expect(result.shifted).toBe(false);
    expect(result.shiftDirection).toBeUndefined();
  });

  it('beats DC (not by 10): success, shifted=false', () => {
    const result = computeDegree(18, 15, 8);
    expect(result.degree).toBe('success');
    expect(result.baseDegree).toBe('success');
    expect(result.shifted).toBe(false);
  });

  it('below DC (not by 10): failure, shifted=false', () => {
    const result = computeDegree(12, 15, 5);
    expect(result.degree).toBe('failure');
    expect(result.baseDegree).toBe('failure');
    expect(result.shifted).toBe(false);
  });

  it('below DC by 10+: critical-failure, shifted=false', () => {
    const result = computeDegree(3, 15, 3);
    expect(result.degree).toBe('critical-failure');
    expect(result.baseDegree).toBe('critical-failure');
    expect(result.shifted).toBe(false);
  });
});

describe('computeDegree — nat 20 shifts', () => {
  it('nat 20 shifts failure to success', () => {
    const result = computeDegree(12, 15, 20);
    expect(result.degree).toBe('success');
    expect(result.baseDegree).toBe('failure');
    expect(result.shifted).toBe(true);
    expect(result.shiftDirection).toBe('up');
  });

  it('nat 20 on extreme miss: critical-failure → failure (not success)', () => {
    const result = computeDegree(5, 20, 20);
    expect(result.degree).toBe('failure');
    expect(result.baseDegree).toBe('critical-failure');
    expect(result.shifted).toBe(true);
    expect(result.shiftDirection).toBe('up');
  });

  it('nat 20 that already wins by 10+ stays critical-success (no double-crit)', () => {
    const result = computeDegree(30, 15, 20);
    expect(result.degree).toBe('critical-success');
    expect(result.baseDegree).toBe('critical-success');
    expect(result.shifted).toBe(false);
  });
});

describe('computeDegree — nat 1 shifts', () => {
  it('nat 1 on high-mod roll: critical-success → success', () => {
    const result = computeDegree(22, 10, 1);
    expect(result.degree).toBe('success');
    expect(result.baseDegree).toBe('critical-success');
    expect(result.shifted).toBe(true);
    expect(result.shiftDirection).toBe('down');
  });

  it('nat 1 that already fails by 10+ stays critical-failure (no double-crit)', () => {
    // total=-5, dc=6 → diff=-11 → base crit-failure; nat 1 shift has no effect (already minimum)
    const result = computeDegree(-5, 6, 1);
    expect(result.degree).toBe('critical-failure');
    expect(result.baseDegree).toBe('critical-failure');
    expect(result.shifted).toBe(false);
  });
});

describe('DEGREE_COLORS', () => {
  it('maps critical-success to gold', () => {
    expect(DEGREE_COLORS['critical-success']).toBe('#FFD700');
  });

  it('maps success to green', () => {
    expect(DEGREE_COLORS['success']).toBe('#00C853');
  });

  it('maps failure to orange', () => {
    expect(DEGREE_COLORS['failure']).toBe('#FF6D00');
  });

  it('maps critical-failure to red', () => {
    expect(DEGREE_COLORS['critical-failure']).toBe('#D50000');
  });

  it('covers all four degree values', () => {
    const degrees: DegreeOfSuccess[] = [
      'critical-success',
      'success',
      'failure',
      'critical-failure',
    ];
    for (const d of degrees) {
      expect(DEGREE_COLORS[d]).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});
