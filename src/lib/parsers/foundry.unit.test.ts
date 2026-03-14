import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parseFoundry } from './foundry';
import { ImportError } from './types';

// Load real sample JSON files from project root
const ROOT = process.cwd();

function loadFoundry(filename: string): unknown {
  const raw = readFileSync(path.resolve(ROOT, filename), 'utf-8');
  return JSON.parse(raw);
}

const knurvikRaw = loadFoundry('Foundry-Knurvik.json');
const brickneyRaw = loadFoundry('fvtt-Actor-brickney-spears-kD69apec02bY9XjJ(1).json');
const duinRaw = loadFoundry('fvtt-Actor-duin-VF2PpLQ7kpsQAWQR.json');
const rooRaw = loadFoundry('fvtt-Actor-roo-mb63FZgHYZtMnn0H.json');

// ─── Common assertions for all Foundry characters ────────────────────────────

describe('parseFoundry - common fields', () => {
  const chars = [
    { raw: knurvikRaw, label: 'Knurvik' },
    { raw: brickneyRaw, label: 'Brickney' },
    { raw: duinRaw, label: 'Duin' },
    { raw: rooRaw, label: 'Roo' },
  ];

  for (const { raw, label } of chars) {
    it(`${label}: sourceFormat is "foundry"`, () => {
      const char = parseFoundry(raw);
      expect(char.sourceFormat).toBe('foundry');
    });

    it(`${label}: importedAt is a Date`, () => {
      const char = parseFoundry(raw);
      expect(char.importedAt).toBeInstanceOf(Date);
    });

    it(`${label}: has all 6 ability modifiers as numbers`, () => {
      const char = parseFoundry(raw);
      expect(typeof char.abilities.str).toBe('number');
      expect(typeof char.abilities.dex).toBe('number');
      expect(typeof char.abilities.con).toBe('number');
      expect(typeof char.abilities.int).toBe('number');
      expect(typeof char.abilities.wis).toBe('number');
      expect(typeof char.abilities.cha).toBe('number');
    });

    it(`${label}: has 3 saves as numbers`, () => {
      const char = parseFoundry(raw);
      expect(typeof char.saves.fortitude).toBe('number');
      expect(typeof char.saves.reflex).toBe('number');
      expect(typeof char.saves.will).toBe('number');
    });

    it(`${label}: perception is a number`, () => {
      const char = parseFoundry(raw);
      expect(typeof char.perception).toBe('number');
    });

    it(`${label}: skills array is non-empty`, () => {
      const char = parseFoundry(raw);
      expect(Array.isArray(char.skills)).toBe(true);
      expect(char.skills.length).toBeGreaterThan(0);
    });
  }
});

// ─── Knurvik (Monk L1) ───────────────────────────────────────────────────────

describe('parseFoundry - Knurvik (Monk L1)', () => {
  let char: ReturnType<typeof parseFoundry>;
  beforeAll(() => { char = parseFoundry(knurvikRaw); });

  it('name is "Knurvik"', () => expect(char.name).toBe('Knurvik'));
  it('class is "Monk"', () => expect(char.class).toBe('Monk'));
  it('level is 1', () => expect(char.level).toBe(1));
  it('keyAbility is "str"', () => expect(char.keyAbility).toBe('str'));

  it('STR modifier is +4', () => expect(char.abilities.str).toBe(4));
  it('DEX modifier is +1', () => expect(char.abilities.dex).toBe(1));
  it('CON modifier is +1', () => expect(char.abilities.con).toBe(1));
  it('INT modifier is +1', () => expect(char.abilities.int).toBe(1));
  it('WIS modifier is +3', () => expect(char.abilities.wis).toBe(3));
  it('CHA modifier is -1', () => expect(char.abilities.cha).toBe(-1));

  it('fortitude is 6 (CON+1 + expert rank 2 at L1 = 1+5)', () => expect(char.saves.fortitude).toBe(6));
  it('reflex is 6 (DEX+1 + expert rank 2 at L1 = 1+5)', () => expect(char.saves.reflex).toBe(6));
  it('will is 8 (WIS+3 + expert rank 2 at L1 = 3+5)', () => expect(char.saves.will).toBe(8));
  it('perception is 6 (WIS+3 + trained rank 1 at L1 = 3+3)', () => expect(char.perception).toBe(6));

  it('has weapons', () => expect(char.weapons.length).toBeGreaterThan(0));

  it('each weapon has required fields', () => {
    for (const w of char.weapons) {
      expect(typeof w.name).toBe('string');
      expect(typeof w.attackBonus).toBe('number');
      expect(typeof w.damageDice).toBe('number');
      expect(typeof w.damageDie).toBe('string');
      expect(typeof w.damageType).toBe('string');
    }
  });

  it('ancestry is "Jotunborn"', () => expect(char.ancestry).toBe('Jotunborn'));
  it('class is "Monk"', () => expect(char.class).toBe('Monk'));
});

// ─── Brickney Spears (Barbarian L1) ──────────────────────────────────────────

describe('parseFoundry - Brickney Spears (Barbarian L1)', () => {
  let char: ReturnType<typeof parseFoundry>;
  beforeAll(() => { char = parseFoundry(brickneyRaw); });

  it('name contains "Brickney"', () => expect(char.name).toContain('Brickney'));
  it('class is "Barbarian"', () => expect(char.class).toBe('Barbarian'));
  it('level is 1', () => expect(char.level).toBe(1));
  it('has 3 saves', () => {
    expect(typeof char.saves.fortitude).toBe('number');
    expect(typeof char.saves.reflex).toBe('number');
    expect(typeof char.saves.will).toBe('number');
  });
});

// ─── Duin (Cleric L1) ────────────────────────────────────────────────────────

describe('parseFoundry - Duin (Cleric L1)', () => {
  let char: ReturnType<typeof parseFoundry>;
  beforeAll(() => { char = parseFoundry(duinRaw); });

  it('name is "Duin"', () => expect(char.name).toBe('Duin'));
  it('class is "Cleric"', () => expect(char.class).toBe('Cleric'));
  it('level is 1', () => expect(char.level).toBe(1));
  it('keyAbility is "wis"', () => expect(char.keyAbility).toBe('wis'));
  it('perception is a number', () => expect(typeof char.perception).toBe('number'));
  it('saves are numbers', () => {
    expect(typeof char.saves.fortitude).toBe('number');
    expect(typeof char.saves.reflex).toBe('number');
    expect(typeof char.saves.will).toBe('number');
  });
});

// ─── Roo (Thaumaturge L1) ────────────────────────────────────────────────────

describe('parseFoundry - Roo (Thaumaturge L1)', () => {
  let char: ReturnType<typeof parseFoundry>;
  beforeAll(() => { char = parseFoundry(rooRaw); });

  it('name is "Roo"', () => expect(char.name).toBe('Roo'));
  it('class is "Thaumaturge"', () => expect(char.class).toBe('Thaumaturge'));
  it('level is 1', () => expect(char.level).toBe(1));
});

// ─── Error cases ──────────────────────────────────────────────────────────────

describe('parseFoundry - error cases', () => {
  it('throws ImportError for completely invalid JSON object', () => {
    expect(() => parseFoundry({ foo: 'bar' })).toThrow(ImportError);
  });

  it('throws ImportError with descriptive message for null input', () => {
    expect(() => parseFoundry(null)).toThrow(ImportError);
  });

  it('throws ImportError when type !== "character"', () => {
    const bad = { ...knurvikRaw as object, type: 'npc' };
    expect(() => parseFoundry(bad)).toThrow(ImportError);
  });

  it('throws ImportError when system.details.level is missing', () => {
    const d = JSON.parse(JSON.stringify(knurvikRaw));
    delete d.system.details.level;
    expect(() => parseFoundry(d)).toThrow(ImportError);
    try {
      parseFoundry(d);
    } catch (e) {
      expect(e).toBeInstanceOf(ImportError);
      expect((e as ImportError).message).toMatch(/level/i);
    }
  });

  it('throws ImportError mentioning the missing field path', () => {
    const d = JSON.parse(JSON.stringify(knurvikRaw));
    delete d.system;
    try {
      parseFoundry(d);
    } catch (e) {
      expect(e).toBeInstanceOf(ImportError);
      expect((e as ImportError).missingField).toBeTruthy();
    }
  });
});
