import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parsePathbuilder } from './pathbuilder';
import { ImportError } from './types';

// Load real sample JSON file from project root
const ROOT = process.cwd();

function loadJson(filename: string): unknown {
  const raw = readFileSync(path.resolve(ROOT, filename), 'utf-8');
  return JSON.parse(raw);
}

const kairosRaw = loadJson('Pathbuilder-Kairos.json');

// ─── Kairos (Magus L6) ───────────────────────────────────────────────────────

describe('parsePathbuilder - Kairos (Magus L6)', () => {
  let char: ReturnType<typeof parsePathbuilder>;

  beforeAll(() => {
    char = parsePathbuilder(kairosRaw);
  });

  // Identity
  it('name starts with "Kairos"', () => expect(char.name).toMatch(/^Kairos/));
  it('class is "Magus"', () => expect(char.class).toBe('Magus'));
  it('level is 6', () => expect(char.level).toBe(6));
  it('keyAbility is present', () => expect(char.keyAbility).toBeTruthy());
  it('sourceFormat is "pathbuilder"', () => expect(char.sourceFormat).toBe('pathbuilder'));
  it('importedAt is a Date', () => expect(char.importedAt).toBeInstanceOf(Date));

  // Abilities — Kairos scores: STR 19, DEX 12, CON 16, INT 16, WIS 12, CHA 10
  it('STR modifier is +4 (score 19, floor((19-10)/2)=4)', () => expect(char.abilities.str).toBe(4));
  it('DEX modifier is +1 (score 12)', () => expect(char.abilities.dex).toBe(1));
  it('CON modifier is +3 (score 16)', () => expect(char.abilities.con).toBe(3));
  it('INT modifier is +3 (score 16)', () => expect(char.abilities.int).toBe(3));
  it('WIS modifier is +1 (score 12)', () => expect(char.abilities.wis).toBe(1));
  it('CHA modifier is +0 (score 10)', () => expect(char.abilities.cha).toBe(0));
  it('all ability modifiers are numbers', () => {
    for (const [, v] of Object.entries(char.abilities)) {
      expect(typeof v).toBe('number');
    }
  });

  // Saves
  // Pathbuilder profBonus = rank === 0 ? 0 : level + rank
  // Fort: CON+3, fortitude rank 4, profBonus = 6+4=10, total = 3+10=13
  it('fortitude is 13', () => expect(char.saves.fortitude).toBe(13));
  // Ref: DEX+1, reflex rank 4, profBonus = 6+4=10, total = 1+10=11. Plus item bonus 3 = 14
  it('reflex is 14 (DEX+1 + prof 10 + item bonus 3)', () => expect(char.saves.reflex).toBe(14));
  // Will: WIS+1, will rank 4, profBonus = 6+4=10, total = 1+10=11
  it('will is 11', () => expect(char.saves.will).toBe(11));

  // Perception
  // WIS+1, perception rank 2, profBonus = 6+2=8, total = 1+8=9
  it('perception is 9 (WIS+1 + trained prof at L6)', () => expect(char.perception).toBe(9));

  // Skills
  it('skills array is non-empty', () => {
    expect(Array.isArray(char.skills)).toBe(true);
    expect(char.skills.length).toBeGreaterThan(0);
  });

  it('includes "athletics" skill', () => {
    const ath = char.skills.find(s => s.slug === 'athletics');
    expect(ath).toBeDefined();
  });

  it('includes "arcana" skill', () => {
    const arc = char.skills.find(s => s.slug === 'arcana');
    expect(arc).toBeDefined();
  });

  it('athletics total is 14 (STR+4 + expert prof at L6 = 4+10)', () => {
    const ath = char.skills.find(s => s.slug === 'athletics');
    expect(ath?.total).toBe(14);
  });

  it('arcana total is 14 (INT+3 + master prof at L6 = 3+10 + item bonus 1)', () => {
    const arc = char.skills.find(s => s.slug === 'arcana');
    expect(arc?.total).toBe(14);
  });

  it('skill item bonuses are tracked separately', () => {
    const arc = char.skills.find(s => s.slug === 'arcana');
    expect(arc?.itemBonus).toBe(1);
  });

  it('proficiencyRank is in 0-4 Foundry scale', () => {
    for (const skill of char.skills) {
      expect(skill.proficiencyRank).toBeGreaterThanOrEqual(0);
      expect(skill.proficiencyRank).toBeLessThanOrEqual(4);
    }
  });

  // Weapons
  it('weapons array is non-empty', () => {
    expect(Array.isArray(char.weapons)).toBe(true);
    expect(char.weapons.length).toBeGreaterThan(0);
  });

  it('each weapon has attackBonus, damageDice, damageDie, damageType', () => {
    for (const w of char.weapons) {
      expect(typeof w.attackBonus).toBe('number');
      expect(typeof w.damageDice).toBe('number');
      expect(typeof w.damageDie).toBe('string');
      expect(typeof w.damageType).toBe('string');
    }
  });

  it('Staff weapon has attackBonus 15', () => {
    const staff = char.weapons.find(w => w.name.toLowerCase().includes('staff'));
    expect(staff?.attackBonus).toBe(15);
  });

  it('Staff with "striking" rune has damageDice of 2', () => {
    const staff = char.weapons.find(w => w.name.toLowerCase().includes('staff'));
    expect(staff?.damageDice).toBe(2);
  });

  // Spells
  it('spellcasters array is non-empty', () => {
    expect(Array.isArray(char.spellcasters)).toBe(true);
    expect(char.spellcasters.length).toBeGreaterThan(0);
  });

  it('at least one spellcaster has tradition, spellAttack, spellDC', () => {
    const sc = char.spellcasters[0];
    expect(sc.tradition).toBeTruthy();
    expect(typeof sc.spellAttack).toBe('number');
    expect(typeof sc.spellDC).toBe('number');
  });

  it('Magus spellAttack is 11 (INT+3 + trained prof at L6)', () => {
    const magus = char.spellcasters.find(sc => sc.name === 'Magus');
    expect(magus?.spellAttack).toBe(11);
  });

  it('Magus spellDC is 21 (10 + 11)', () => {
    const magus = char.spellcasters.find(sc => sc.name === 'Magus');
    expect(magus?.spellDC).toBe(21);
  });

  it('has arcane tradition', () => {
    const arcane = char.spellcasters.find(sc => sc.tradition === 'arcane');
    expect(arcane).toBeDefined();
  });

  // Feats
  it('feats array is non-empty', () => {
    expect(Array.isArray(char.feats)).toBe(true);
    expect(char.feats.length).toBeGreaterThan(0);
  });

  it('each feat has name and category', () => {
    for (const feat of char.feats) {
      expect(typeof feat.name).toBe('string');
      expect(feat.name.length).toBeGreaterThan(0);
      expect(typeof feat.category).toBe('string');
    }
  });

  // HP
  // classhp*level + ancestryhp + bonushp + bonushpPerLevel*level + conMod*level
  // = 8*6 + 6 + 0 + 0*6 + 3*6 = 48+6+0+0+18 = 72
  it('maxHp is 72', () => expect(char.maxHp).toBe(72));

  // Lore skills are included
  it('includes lore skills', () => {
    const lore = char.skills.find(s => s.slug.includes('lore') || s.label.includes('Lore') || s.label.includes('Kingdoms'));
    expect(lore).toBeDefined();
  });
});

// ─── Error cases ──────────────────────────────────────────────────────────────

describe('parsePathbuilder - error cases', () => {
  it('throws ImportError for null input', () => {
    expect(() => parsePathbuilder(null)).toThrow(ImportError);
  });

  it('throws ImportError for completely invalid object', () => {
    expect(() => parsePathbuilder({ foo: 'bar' })).toThrow(ImportError);
  });

  it('throws ImportError when success is false', () => {
    const bad = { success: false, build: {} };
    expect(() => parsePathbuilder(bad)).toThrow(ImportError);
  });

  it('throws ImportError mentioning "build" when build object is missing', () => {
    const bad = { success: true };
    try {
      parsePathbuilder(bad);
    } catch (e) {
      expect(e).toBeInstanceOf(ImportError);
      expect((e as ImportError).message.toLowerCase()).toMatch(/build/);
    }
  });

  it('throws ImportError when required build.name is missing', () => {
    const d = JSON.parse(JSON.stringify(kairosRaw));
    delete d.build.name;
    expect(() => parsePathbuilder(d)).toThrow(ImportError);
  });
});
