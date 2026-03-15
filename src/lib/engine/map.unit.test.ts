import { describe, it, expect } from 'vitest';
import { computeMAP } from './map';

describe('computeMAP — standard weapon', () => {
  it('attack 1: 0 penalty', () => {
    expect(computeMAP(1, false)).toBe(0);
  });

  it('attack 2: -5 penalty', () => {
    expect(computeMAP(2, false)).toBe(-5);
  });

  it('attack 3: -10 penalty', () => {
    expect(computeMAP(3, false)).toBe(-10);
  });
});

describe('computeMAP — agile weapon', () => {
  it('attack 1: 0 penalty', () => {
    expect(computeMAP(1, true)).toBe(0);
  });

  it('attack 2: -4 penalty', () => {
    expect(computeMAP(2, true)).toBe(-4);
  });

  it('attack 3: -8 penalty', () => {
    expect(computeMAP(3, true)).toBe(-8);
  });
});
