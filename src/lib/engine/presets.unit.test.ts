import { describe, it, expect } from 'vitest';
import { PRESET_MODIFIERS } from './presets';

describe('PRESET_MODIFIERS', () => {
  it('all presets have enabled=false by default', () => {
    for (const preset of PRESET_MODIFIERS) {
      expect(preset.enabled).toBe(false);
    }
  });

  it('all presets have unique ids', () => {
    const ids = PRESET_MODIFIERS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('includes flanking (+2 circumstance)', () => {
    const flanking = PRESET_MODIFIERS.find((p) => p.id === 'flanking');
    expect(flanking).toBeDefined();
    expect(flanking!.type).toBe('circumstance');
    expect(flanking!.value).toBe(2);
  });

  it('includes inspire courage (+1 status)', () => {
    const ic = PRESET_MODIFIERS.find((p) => p.id === 'inspire-courage');
    expect(ic).toBeDefined();
    expect(ic!.type).toBe('status');
    expect(ic!.value).toBe(1);
  });

  it('includes frightened 1/2/3 as status penalties', () => {
    const f1 = PRESET_MODIFIERS.find((p) => p.id === 'frightened-1');
    const f2 = PRESET_MODIFIERS.find((p) => p.id === 'frightened-2');
    const f3 = PRESET_MODIFIERS.find((p) => p.id === 'frightened-3');
    expect(f1?.value).toBe(-1);
    expect(f2?.value).toBe(-2);
    expect(f3?.value).toBe(-3);
    expect(f1?.type).toBe('status');
    expect(f2?.type).toBe('status');
    expect(f3?.type).toBe('status');
  });

  it('includes sickened 1 as status penalty', () => {
    const s1 = PRESET_MODIFIERS.find((p) => p.id === 'sickened-1');
    expect(s1).toBeDefined();
    expect(s1!.type).toBe('status');
    expect(s1!.value).toBe(-1);
  });

  it('includes clumsy 1 and 2 as status penalties', () => {
    const c1 = PRESET_MODIFIERS.find((p) => p.id === 'clumsy-1');
    const c2 = PRESET_MODIFIERS.find((p) => p.id === 'clumsy-2');
    expect(c1?.value).toBe(-1);
    expect(c2?.value).toBe(-2);
    expect(c1?.type).toBe('status');
    expect(c2?.type).toBe('status');
  });
});
