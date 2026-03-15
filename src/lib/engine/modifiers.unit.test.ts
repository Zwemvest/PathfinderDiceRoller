import { describe, it, expect } from 'vitest';
import { resolveModifiers } from './modifiers';
import type { ModifierEntry } from './types';

function entry(
  id: string,
  label: string,
  type: ModifierEntry['type'],
  value: number,
  enabled = true,
): ModifierEntry {
  return { id, label, type, value, enabled };
}

describe('resolveModifiers — typed bonus stacking', () => {
  it('two status bonuses: keeps only the highest', () => {
    const result = resolveModifiers([
      entry('s1', 'A', 'status', 1),
      entry('s2', 'B', 'status', 2),
    ]);
    expect(result.total).toBe(2);
    expect(result.kept).toHaveLength(1);
    expect(result.kept[0].value).toBe(2);
  });

  it('two circumstance bonuses: keeps only the highest', () => {
    const result = resolveModifiers([
      entry('c1', 'A', 'circumstance', 1),
      entry('c2', 'B', 'circumstance', 3),
    ]);
    expect(result.total).toBe(3);
    expect(result.kept).toHaveLength(1);
    expect(result.kept[0].value).toBe(3);
  });

  it('two item bonuses: keeps only the highest', () => {
    const result = resolveModifiers([
      entry('i1', 'A', 'item', 1),
      entry('i2', 'B', 'item', 2),
    ]);
    expect(result.total).toBe(2);
    expect(result.kept).toHaveLength(1);
    expect(result.kept[0].value).toBe(2);
  });

  it('multiple untyped bonuses: all stack', () => {
    const result = resolveModifiers([
      entry('u1', 'A', 'untyped', 1),
      entry('u2', 'B', 'untyped', 2),
      entry('u3', 'C', 'untyped', 3),
    ]);
    expect(result.total).toBe(6);
    expect(result.kept).toHaveLength(3);
  });
});

describe('resolveModifiers — typed penalty stacking', () => {
  it('status bonus and status penalty: both kept', () => {
    const result = resolveModifiers([
      entry('s1', 'Bonus', 'status', 2),
      entry('s2', 'Penalty', 'status', -1),
    ]);
    expect(result.total).toBe(1);
    expect(result.kept).toHaveLength(2);
  });

  it('two status penalties: keeps only the worst', () => {
    const result = resolveModifiers([
      entry('s1', 'P1', 'status', -1),
      entry('s2', 'P2', 'status', -3),
    ]);
    expect(result.total).toBe(-3);
    expect(result.kept).toHaveLength(1);
    expect(result.kept[0].value).toBe(-3);
  });
});

describe('resolveModifiers — disabled entries', () => {
  it('disabled entries are excluded from result', () => {
    const result = resolveModifiers([
      entry('s1', 'Enabled', 'status', 2, true),
      entry('s2', 'Disabled', 'status', 5, false),
    ]);
    expect(result.total).toBe(2);
    expect(result.kept).toHaveLength(1);
  });
});

describe('resolveModifiers — mixed types', () => {
  it('status +2, circumstance +1, item +1, untyped -2 = total 2', () => {
    const result = resolveModifiers([
      entry('s1', 'Status', 'status', 2),
      entry('c1', 'Circ', 'circumstance', 1),
      entry('i1', 'Item', 'item', 1),
      entry('u1', 'Untyped', 'untyped', -2),
    ]);
    expect(result.total).toBe(2);
    expect(result.kept).toHaveLength(4);
  });

  it('breakdown reflects per-type subtotals', () => {
    const result = resolveModifiers([
      entry('s1', 'Status', 'status', 2),
      entry('c1', 'Circ', 'circumstance', 3),
      entry('i1', 'Item', 'item', 1),
      entry('u1', 'Untyped', 'untyped', -1),
    ]);
    expect(result.breakdown.status).toBe(2);
    expect(result.breakdown.circumstance).toBe(3);
    expect(result.breakdown.item).toBe(1);
    expect(result.breakdown.untyped).toBe(-1);
  });
});

describe('resolveModifiers — edge cases', () => {
  it('empty array returns total=0, kept=[], breakdown all zeros', () => {
    const result = resolveModifiers([]);
    expect(result.total).toBe(0);
    expect(result.kept).toHaveLength(0);
    expect(result.breakdown.status).toBe(0);
    expect(result.breakdown.circumstance).toBe(0);
    expect(result.breakdown.item).toBe(0);
    expect(result.breakdown.untyped).toBe(0);
  });
});
