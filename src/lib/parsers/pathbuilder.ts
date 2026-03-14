import {
  type NormalizedCharacter,
  type NormalizedAbilities,
  type NormalizedSaves,
  type NormalizedSkill,
  type NormalizedWeapon,
  type NormalizedSpellcaster,
  type NormalizedSpell,
  type NormalizedFeat,
  type AbilitySlug,
  type FeatCategory,
  ImportError,
  requireField,
  SKILL_ABILITY_MAP,
  ALL_SKILLS,
  SKILL_LABELS,
} from './types';

// ─── Pathbuilder proficiency bonus ────────────────────────────────────────────
// Pathbuilder stores ranks as 0/2/4/6/8 (where rank already incorporates *2 factor).
// profBonus = rank === 0 ? 0 : level + rank

function profBonusPB(rank: number, level: number): number {
  return rank === 0 ? 0 : level + rank;
}

// ─── Normalize Pathbuilder rank (0/2/4/6/8) to Foundry scale (0-4) ───────────

function normalizeRank(pbRank: number): number {
  return pbRank / 2;
}

// ─── Ability modifier from score ──────────────────────────────────────────────

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

// ─── Feat category mapping ────────────────────────────────────────────────────

function mapFeatCategory(cat: string): FeatCategory {
  const lower = (cat ?? '').toLowerCase();
  if (lower === 'class feat') return 'class';
  if (lower === 'ancestry feat') return 'ancestry';
  if (lower === 'heritage') return 'heritage';
  if (lower === 'general feat') return 'general';
  if (lower === 'skill feat') return 'skill';
  if (lower === 'archetype feat') return 'archetype';
  if (lower === 'awarded feat') return 'bonus';
  if (lower === 'classfeature') return 'classfeature';
  return 'other';
}

// ─── Striking rune → dice count ──────────────────────────────────────────────

function strikingDiceCount(strikingStr: string): number {
  switch (strikingStr) {
    case 'striking': return 1;
    case 'greaterStriking': return 2;
    case 'majorStriking': return 3;
    default: return 0; // no striking rune: 0 bonus dice (total dice = 1)
  }
}

// ─── TitleCase for mod lookup ─────────────────────────────────────────────────

function toTitleCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Known mods keys follow title case (e.g. "Arcana", "Stealth", "Reflex")
function skillModsKey(slug: string): string {
  return SKILL_LABELS[slug] ?? toTitleCase(slug);
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parsePathbuilder(json: unknown): NormalizedCharacter {
  if (json === null || json === undefined || typeof json !== 'object') {
    throw new ImportError('Invalid Pathbuilder JSON: expected an object', 'root');
  }

  const raw = json as Record<string, unknown>;

  // Validate success flag
  const success = raw.success;
  if (success !== true) {
    throw new ImportError(
      'Invalid Pathbuilder JSON: "success" field is not true',
      'success'
    );
  }

  // Require build object
  if (!raw.build || typeof raw.build !== 'object') {
    throw new ImportError(
      'Invalid Pathbuilder JSON: missing "build" object',
      'build'
    );
  }

  const build = raw.build as Record<string, unknown>;

  // Identity fields
  const name = requireField<string>(build, 'name');
  const charClass = requireField<string>(build, 'class');
  const level = requireField<number>(build, 'level');
  const keyAbility = requireField<string>(build, 'keyability') as AbilitySlug;
  const ancestry = (build.ancestry as string) ?? '';
  const heritage = (build.heritage as string) ?? '';
  const background = (build.background as string) ?? '';

  // Abilities — Pathbuilder stores ability SCORES
  const abilitiesRaw = requireField<Record<string, number>>(build, 'abilities');
  const abilities: NormalizedAbilities = {
    str: abilityMod(abilitiesRaw.str),
    dex: abilityMod(abilitiesRaw.dex),
    con: abilityMod(abilitiesRaw.con),
    int: abilityMod(abilitiesRaw.int),
    wis: abilityMod(abilitiesRaw.wis),
    cha: abilityMod(abilitiesRaw.cha),
  };

  // Proficiencies
  const proficiencies = requireField<Record<string, number>>(build, 'proficiencies');

  // Mods — item bonuses keyed by TitleCase name
  const modsRaw = (build.mods ?? {}) as Record<string, Record<string, number>>;

  function getItemBonus(modsKey: string): number {
    return modsRaw?.[modsKey]?.['Item Bonus'] ?? 0;
  }

  // Saves
  const saves: NormalizedSaves = {
    fortitude: abilities.con + profBonusPB(proficiencies.fortitude, level) + getItemBonus('Fortitude'),
    reflex: abilities.dex + profBonusPB(proficiencies.reflex, level) + getItemBonus('Reflex'),
    will: abilities.wis + profBonusPB(proficiencies.will, level) + getItemBonus('Will'),
  };

  // Perception
  const perception = abilities.wis + profBonusPB(proficiencies.perception, level) + getItemBonus('Perception');

  // Skills — standard PF2e skills
  const skills: NormalizedSkill[] = [];

  for (const slug of ALL_SKILLS) {
    const abilitySlug = SKILL_ABILITY_MAP[slug];
    const abilMod = abilities[abilitySlug];
    const pbRank = proficiencies[slug] ?? 0;
    const profBonus = profBonusPB(pbRank, level);
    const modsKey = skillModsKey(slug);
    const itemBonus = getItemBonus(modsKey);
    const total = abilMod + profBonus + itemBonus;

    skills.push({
      slug,
      label: SKILL_LABELS[slug],
      ability: abilitySlug,
      total,
      proficiencyRank: normalizeRank(pbRank),
      itemBonus,
    });
  }

  // Lore skills from build.lores — array of [name, pbRank] tuples
  const lores = (build.lores ?? []) as Array<[string, number]>;
  for (const [loreName, pbRank] of lores) {
    const abilMod = abilities.int;
    const profBonus = profBonusPB(pbRank, level);
    const modsKey = loreName; // exact lore name for mods lookup
    const itemBonus = getItemBonus(modsKey);
    const slug = loreName.toLowerCase().replace(/\s+/g, '-') + '-lore';
    const label = `${loreName} Lore`;

    skills.push({
      slug,
      label,
      ability: 'int',
      total: abilMod + profBonus + itemBonus,
      proficiencyRank: normalizeRank(pbRank),
      itemBonus,
    });
  }

  // Weapons — Pathbuilder weapons have pre-computed attack bonus
  const weaponsRaw = (build.weapons ?? []) as Array<{
    name: string;
    die: string;
    pot: number;
    str: string; // striking rune name (NOT the STR ability!)
    damageType: string;
    attack: number;
    damageBonus: number;
    extraDamage: string[];
    runes: string[];
  }>;

  const weapons: NormalizedWeapon[] = weaponsRaw.map((w) => {
    const strikingBonus = strikingDiceCount(w.str);
    const damageDice = 1 + strikingBonus;

    return {
      name: w.name,
      attackBonus: w.attack,
      damageDice,
      damageDie: w.die ?? 'd4',
      damageType: (w.damageType ?? 'bludgeoning').toLowerCase(),
      damageBonus: w.damageBonus ?? 0,
      traits: w.runes ?? [],
      extraDamage: w.extraDamage ?? [],
    };
  });

  // Spellcasters
  const spellcastersRaw = (build.spellCasters ?? []) as Array<{
    name: string;
    magicTradition: string;
    spellcastingType: string;
    ability: string;
    proficiency: number;
    focusPoints: number;
    perDay: number[];
    spells: Array<{ spellLevel: number; list: string[] }>;
    prepared?: Array<{ spellLevel: number; list: Array<{ spellName: string; prepared: number }> }>;
  }>;

  const spellcasters: NormalizedSpellcaster[] = spellcastersRaw.map((sc) => {
    const scAbility = sc.ability as AbilitySlug;
    const scAbilMod = abilities[scAbility];
    const profBonus = profBonusPB(sc.proficiency, level);
    const spellAttack = scAbilMod + profBonus;
    const spellDC = 10 + spellAttack;

    // Flatten spells from spells array (cantrips + higher levels)
    const spellList: NormalizedSpell[] = [];
    for (const group of sc.spells ?? []) {
      for (const spellName of group.list) {
        spellList.push({ name: spellName, level: group.spellLevel });
      }
    }

    return {
      name: sc.name,
      tradition: sc.magicTradition as NormalizedSpellcaster['tradition'],
      spellcastingType: sc.spellcastingType as NormalizedSpellcaster['spellcastingType'],
      ability: scAbility,
      spellAttack,
      spellDC,
      focusPoints: sc.focusPoints ?? 0,
      perDay: sc.perDay ?? [],
      spells: spellList,
    };
  });

  // Feats — tuples [name, null, category, level, ...]
  const featsRaw = (build.feats ?? []) as Array<[string, null, string, number, ...unknown[]]>;
  const feats: NormalizedFeat[] = featsRaw
    .filter((f) => {
      // Filter out fluff entries (name starts with "!")
      const featName = f[0] ?? '';
      return !featName.startsWith('!');
    })
    .map((f) => ({
      name: f[0] ?? '',
      level: f[3] ?? 0,
      category: mapFeatCategory(f[2] ?? ''),
    }));

  // HP: classhp*level + ancestryhp + bonushp + bonushpPerLevel*level + conMod*level
  const attrs = (build.attributes ?? {}) as {
    ancestryhp?: number;
    classhp?: number;
    bonushp?: number;
    bonushpPerLevel?: number;
  };
  const classhp = attrs.classhp ?? 0;
  const ancestryhp = attrs.ancestryhp ?? 0;
  const bonushp = attrs.bonushp ?? 0;
  const bonushpPerLevel = attrs.bonushpPerLevel ?? 0;
  const maxHp = classhp * level + ancestryhp + bonushp + bonushpPerLevel * level + abilities.con * level;

  // AC — from acTotal
  const acData = (build.acTotal ?? {}) as { acTotal?: number };
  const ac = acData.acTotal ?? 0;

  // Class DC
  const classDCRank = proficiencies.classDC ?? 0;
  const keyAbilMod = abilities[keyAbility];
  const classDC = 10 + keyAbilMod + profBonusPB(classDCRank, level);

  return {
    name,
    class: charClass,
    level,
    ancestry,
    heritage,
    background,
    keyAbility,
    sourceFormat: 'pathbuilder',
    importedAt: new Date(),
    abilities,
    saves,
    perception,
    maxHp,
    currentHp: maxHp, // Pathbuilder doesn't track current HP
    ac,
    classDC,
    skills,
    weapons,
    spellcasters,
    feats,
  };
}
