// NormalizedCharacter schema — locked in Phase 2.
// All downstream phases (3-7) consume this interface.
// DO NOT change field names without updating all consumers.

// ─── Type aliases ────────────────────────────────────────────────────────────

export type AbilitySlug = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type DamageType =
  | 'bludgeoning'
  | 'piercing'
  | 'slashing'
  | 'fire'
  | 'cold'
  | 'electricity'
  | 'acid'
  | 'sonic'
  | 'force'
  | 'mental'
  | 'poison'
  | 'negative'
  | 'positive'
  | 'chaotic'
  | 'evil'
  | 'good'
  | 'lawful'
  | string; // open for exotic types

export type MagicTradition = 'arcane' | 'divine' | 'occult' | 'primal';

export type SpellcastingType = 'prepared' | 'spontaneous' | 'innate' | 'focus';

export type FeatCategory =
  | 'ancestry'
  | 'class'
  | 'general'
  | 'skill'
  | 'archetype'
  | 'bonus'
  | 'heritage'
  | 'classfeature'
  | 'other';

// ─── Sub-interfaces ───────────────────────────────────────────────────────────

export interface NormalizedAbilities {
  str: number; // modifier, not score
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface NormalizedSaves {
  fortitude: number; // total modifier
  reflex: number;
  will: number;
}

export interface NormalizedSkill {
  slug: string;          // e.g. "athletics", "arcana"
  label: string;         // display name e.g. "Athletics"
  ability: AbilitySlug;  // governing ability
  total: number;         // total modifier (ability + prof + item)
  proficiencyRank: number; // 0-4 Foundry scale (untrained/trained/expert/master/legendary)
  itemBonus: number;     // item bonus component
}

export interface NormalizedWeapon {
  name: string;
  attackBonus: number;   // total attack modifier
  damageDice: number;    // number of dice (includes striking rune)
  damageDie: string;     // e.g. "d8"
  damageType: DamageType;
  damageBonus: number;   // flat damage bonus (ability mod + potency bonus)
  traits: string[];
  extraDamage: string[]; // additional damage expressions e.g. "1d6 fire"
}

export interface NormalizedSpell {
  name: string;
  level: number;        // spell level 0-10
}

export interface NormalizedSpellcaster {
  name: string;
  tradition: MagicTradition;
  spellcastingType: SpellcastingType;
  ability: AbilitySlug;
  spellAttack: number;
  spellDC: number;
  focusPoints: number;
  perDay: number[];     // slots per spell level [cantrips, 1st, 2nd, ...]
  spells: NormalizedSpell[];
  prepared?: NormalizedSpell[]; // for prepared casters
}

export interface NormalizedFeat {
  name: string;
  level: number;
  category: FeatCategory;
}

export interface NormalizedCharacter {
  // Identity
  name: string;
  class: string;
  level: number;
  ancestry: string;
  heritage: string;
  background: string;
  keyAbility: AbilitySlug;
  sourceFormat: 'foundry' | 'pathbuilder';
  importedAt: Date;

  // Core stats
  abilities: NormalizedAbilities;
  saves: NormalizedSaves;
  perception: number;   // total modifier
  maxHp: number;
  currentHp: number;
  ac: number;
  classDC: number;

  // Collections
  skills: NormalizedSkill[];
  weapons: NormalizedWeapon[];
  spellcasters: NormalizedSpellcaster[];
  feats: NormalizedFeat[];
}

// ─── ImportError class ────────────────────────────────────────────────────────

export class ImportError extends Error {
  missingField: string;

  constructor(message: string, missingField: string) {
    super(message);
    this.name = 'ImportError';
    this.missingField = missingField;
  }
}

// ─── Helper: require a value from a raw JSON path ────────────────────────────

/**
 * Retrieves a nested value from an object by dot-path, throwing ImportError if absent.
 * @param obj   The raw JSON object to traverse
 * @param path  Dot-separated field path, e.g. "system.details.level.value"
 */
export function requireField<T>(obj: unknown, path: string): T {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      throw new ImportError(
        `Missing required field: ${path} (failed at "${part}")`,
        path
      );
    }
    current = (current as Record<string, unknown>)[part];
  }
  if (current === null || current === undefined) {
    throw new ImportError(`Missing required field: ${path}`, path);
  }
  return current as T;
}

// ─── SKILL_ABILITY_MAP ────────────────────────────────────────────────────────

/** Maps each PF2e skill slug to its governing ability slug */
export const SKILL_ABILITY_MAP: Record<string, AbilitySlug> = {
  acrobatics: 'dex',
  arcana: 'int',
  athletics: 'str',
  crafting: 'int',
  deception: 'cha',
  diplomacy: 'cha',
  intimidation: 'cha',
  medicine: 'wis',
  nature: 'wis',
  occultism: 'int',
  performance: 'cha',
  religion: 'wis',
  society: 'int',
  stealth: 'dex',
  survival: 'wis',
  thievery: 'dex',
};

/** All standard PF2e skills in order */
export const ALL_SKILLS: string[] = Object.keys(SKILL_ABILITY_MAP);

/** Human-readable label for each skill slug */
export const SKILL_LABELS: Record<string, string> = {
  acrobatics: 'Acrobatics',
  arcana: 'Arcana',
  athletics: 'Athletics',
  crafting: 'Crafting',
  deception: 'Deception',
  diplomacy: 'Diplomacy',
  intimidation: 'Intimidation',
  medicine: 'Medicine',
  nature: 'Nature',
  occultism: 'Occultism',
  performance: 'Performance',
  religion: 'Religion',
  society: 'Society',
  stealth: 'Stealth',
  survival: 'Survival',
  thievery: 'Thievery',
};
