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

// ─── Internal types for Foundry JSON shapes ───────────────────────────────────

interface FoundryBoostEntry {
  value: string[];
  selected?: string | null;
}

interface FoundryClassItem {
  name: string;
  system: {
    hp: number;
    keyAbility: { value: string[]; selected: string | null };
    savingThrows: { fortitude: number; reflex: number; will: number };
    perception: number;
    trainedSkills: { additional: number; value: string[] };
    attacks: {
      simple: number;
      martial: number;
      advanced: number;
      unarmed: number;
      other: { name: string; rank: number };
    };
  };
}

// ─── Helper: proficiency bonus (Foundry 0-4 rank scale) ──────────────────────

function profBonusFoundry(rank: number, level: number): number {
  return rank === 0 ? 0 : level + rank * 2;
}

// ─── Helper: ability modifier from score ─────────────────────────────────────

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

// ─── Helper: resolve a key ability slug ──────────────────────────────────────

function resolveKeyAbility(keyAbilityData: { value: string[]; selected: string | null }): AbilitySlug {
  const selected = keyAbilityData.selected;
  if (selected && typeof selected === 'string') {
    return selected as AbilitySlug;
  }
  // When selected is null, fall back to first value if unambiguous
  if (keyAbilityData.value && keyAbilityData.value.length >= 1) {
    return keyAbilityData.value[0] as AbilitySlug;
  }
  return 'str';
}

// ─── Ability score reconstruction ────────────────────────────────────────────

function reconstructAbilities(
  items: Record<string, unknown>[],
  systemBuild: { attributes: { boosts: Record<string, string[]> } },
  keyAbility: AbilitySlug
): NormalizedAbilities {
  // Start all ability scores at 10
  const scores: Record<AbilitySlug, number> = {
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
  };

  function applyBoost(ab: AbilitySlug): void {
    scores[ab] = scores[ab] >= 18 ? scores[ab] + 1 : scores[ab] + 2;
  }

  function applyFlaw(ab: AbilitySlug): void {
    scores[ab] -= 2;
  }

  function resolveBoostEntry(entry: FoundryBoostEntry): AbilitySlug | null {
    if (entry.selected && typeof entry.selected === 'string') {
      return entry.selected as AbilitySlug;
    }
    // Single fixed boost (no choice)
    if (entry.value && entry.value.length === 1) {
      return entry.value[0] as AbilitySlug;
    }
    // Free boost not yet selected (null) — skip
    return null;
  }

  // 1. Ancestry boosts and flaws
  const ancestryItem = items.find((i) => (i as { type: string }).type === 'ancestry') as {
    system?: {
      boosts?: Record<string, FoundryBoostEntry>;
      flaws?: Record<string, FoundryBoostEntry>;
    };
  } | undefined;

  if (ancestryItem?.system?.boosts) {
    for (const entry of Object.values(ancestryItem.system.boosts)) {
      const ab = resolveBoostEntry(entry);
      if (ab) applyBoost(ab);
    }
  }

  if (ancestryItem?.system?.flaws) {
    for (const entry of Object.values(ancestryItem.system.flaws)) {
      // Flaws are always fixed (no choice) — take first value
      if (entry.value && entry.value.length > 0) {
        applyFlaw(entry.value[0] as AbilitySlug);
      }
    }
  }

  // 2. Background boosts
  const bgItem = items.find((i) => (i as { type: string }).type === 'background') as {
    system?: { boosts?: Record<string, FoundryBoostEntry> };
  } | undefined;

  if (bgItem?.system?.boosts) {
    for (const entry of Object.values(bgItem.system.boosts)) {
      const ab = resolveBoostEntry(entry);
      if (ab) applyBoost(ab);
    }
  }

  // 3. Class key ability boost
  applyBoost(keyAbility);

  // 4. Level boosts from system.build.attributes.boosts
  const levelBoosts = systemBuild?.attributes?.boosts ?? {};
  for (const boostList of Object.values(levelBoosts)) {
    for (const ab of boostList) {
      applyBoost(ab as AbilitySlug);
    }
  }

  return {
    str: abilityMod(scores.str),
    dex: abilityMod(scores.dex),
    con: abilityMod(scores.con),
    int: abilityMod(scores.int),
    wis: abilityMod(scores.wis),
    cha: abilityMod(scores.cha),
  };
}

// ─── Skill computation ────────────────────────────────────────────────────────

function buildSkills(
  systemSkills: Record<string, { rank?: number; value?: number }>,
  classItem: FoundryClassItem,
  abilities: NormalizedAbilities,
  level: number
): NormalizedSkill[] {
  const result: NormalizedSkill[] = [];

  // Build a rank map — start from system.skills
  const rankMap: Record<string, number> = {};

  // Apply class trained skills
  for (const slug of classItem.system.trainedSkills.value) {
    rankMap[slug] = Math.max(rankMap[slug] ?? 0, 1);
  }

  // Apply system.skills (may be empty {})
  for (const [slug, data] of Object.entries(systemSkills)) {
    const rank = data.rank ?? data.value ?? 0;
    rankMap[slug] = Math.max(rankMap[slug] ?? 0, rank);
  }

  for (const slug of ALL_SKILLS) {
    const abilitySlug = SKILL_ABILITY_MAP[slug];
    const abilMod = abilities[abilitySlug];
    const profRank = rankMap[slug] ?? 0;
    const profBonus = profBonusFoundry(profRank, level);
    const total = abilMod + profBonus;

    result.push({
      slug,
      label: SKILL_LABELS[slug],
      ability: abilitySlug,
      total,
      proficiencyRank: profRank,
      itemBonus: 0,
    });
  }

  return result;
}

// ─── Weapon parsing ───────────────────────────────────────────────────────────

function buildWeapons(
  items: Record<string, unknown>[],
  abilities: NormalizedAbilities,
  classItem: FoundryClassItem,
  level: number
): NormalizedWeapon[] {
  const weapons = items.filter((i) => (i as { type: string }).type === 'weapon') as Array<{
    name: string;
    system: {
      traits: { value: string[] };
      damage: { dice: number; die: string; damageType: string };
      bonus: { value: number };
      runes: { potency: number; striking: number };
      category: string;
    };
  }>;

  return weapons.map((w) => {
    const traits = w.system?.traits?.value ?? [];
    const category = w.system?.category ?? 'simple';
    const potency = w.system?.runes?.potency ?? 0;
    const striking = w.system?.runes?.striking ?? 0;
    const bonusValue = w.system?.bonus?.value ?? 0;

    // Determine proficiency rank for weapon category
    let profRank = 0;
    if (category === 'unarmed') profRank = classItem.system.attacks.unarmed;
    else if (category === 'simple') profRank = classItem.system.attacks.simple;
    else if (category === 'martial') profRank = classItem.system.attacks.martial;
    else if (category === 'advanced') profRank = classItem.system.attacks.advanced;

    // Choose ability: finesse uses DEX if DEX > STR
    const hasFinesse = traits.some((t: string) => t.toLowerCase().includes('finesse'));
    const abilMod = hasFinesse && abilities.dex > abilities.str
      ? abilities.dex
      : abilities.str;

    const attackBonus = abilMod + profBonusFoundry(profRank, level) + potency + bonusValue;

    const damageDice = (w.system?.damage?.dice ?? 1) + striking;
    const damageDie = w.system?.damage?.die ?? 'd4';
    const rawDamageType = w.system?.damage?.damageType ?? 'bludgeoning';

    return {
      name: w.name,
      attackBonus,
      damageDice,
      damageDie,
      damageType: rawDamageType,
      damageBonus: abilMod,
      traits,
      extraDamage: [],
    };
  });
}

// ─── Feat parsing ─────────────────────────────────────────────────────────────

function mapFeatCategory(cat: string): FeatCategory {
  const lower = (cat ?? '').toLowerCase();
  if (lower === 'classfeature') return 'classfeature';
  if (lower === 'class') return 'class';
  if (lower === 'ancestry') return 'ancestry';
  if (lower === 'heritage') return 'heritage';
  if (lower === 'general') return 'general';
  if (lower === 'skill') return 'skill';
  if (lower === 'archetype') return 'archetype';
  if (lower === 'bonus') return 'bonus';
  return 'other';
}

function buildFeats(items: Record<string, unknown>[]): NormalizedFeat[] {
  const featItems = items.filter((i) => (i as { type: string }).type === 'feat') as Array<{
    name: string;
    system: { category: string; level?: { value?: number } };
  }>;

  return featItems.map((f) => ({
    name: f.name,
    level: f.system?.level?.value ?? 0,
    category: mapFeatCategory(f.system?.category ?? ''),
  }));
}

// ─── Spellcasting ─────────────────────────────────────────────────────────────

function buildSpellcasters(
  items: Record<string, unknown>[],
  abilities: NormalizedAbilities,
  level: number
): NormalizedSpellcaster[] {
  const entries = items.filter((i) => (i as { type: string }).type === 'spellcastingEntry') as Array<{
    _id: string;
    name: string;
    system: {
      tradition: { value: string };
      prepared: { value: string };
      ability: { value: string };
      proficiency: { value: number };
      slots?: Record<string, { value: number; max: number }>;
    };
  }>;

  const spellItems = items.filter((i) => (i as { type: string }).type === 'spell') as Array<{
    name: string;
    system: {
      level: { value: number };
      location: { value: string };
    };
  }>;

  return entries.map((entry) => {
    const abilitySlug = (entry.system?.ability?.value ?? 'int') as AbilitySlug;
    const abilMod = abilities[abilitySlug];
    const profRank = entry.system?.proficiency?.value ?? 0;
    const profBonus = profBonusFoundry(profRank, level);
    const spellAttack = abilMod + profBonus;
    const spellDC = 10 + spellAttack;

    // Gather spells belonging to this casting entry
    const entryId = entry._id;
    const entrySpells: NormalizedSpell[] = spellItems
      .filter((s) => s.system?.location?.value === entryId)
      .map((s) => ({
        name: s.name,
        level: s.system?.level?.value ?? 0,
      }));

    // Compute perDay from slots
    const slots = entry.system?.slots ?? {};
    const perDay: number[] = Array(11).fill(0);
    for (const [key, slot] of Object.entries(slots)) {
      const match = key.match(/slot(\d+)/);
      if (match) {
        const idx = parseInt(match[1], 10);
        perDay[idx] = slot.max ?? 0;
      }
    }

    return {
      name: entry.name,
      tradition: (entry.system?.tradition?.value ?? 'arcane') as NormalizedSpellcaster['tradition'],
      spellcastingType: (entry.system?.prepared?.value ?? 'prepared') as NormalizedSpellcaster['spellcastingType'],
      ability: abilitySlug,
      spellAttack,
      spellDC,
      focusPoints: 0,
      perDay,
      spells: entrySpells,
    };
  });
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseFoundry(json: unknown): NormalizedCharacter {
  if (json === null || json === undefined || typeof json !== 'object') {
    throw new ImportError('Invalid Foundry JSON: expected an object', 'root');
  }

  const raw = json as Record<string, unknown>;

  // Validate required top-level fields
  const name = requireField<string>(raw, 'name');
  const type = requireField<string>(raw, 'type');

  if (type !== 'character') {
    throw new ImportError(
      `Invalid Foundry JSON: expected type "character", got "${type}"`,
      'type'
    );
  }

  const system = requireField<Record<string, unknown>>(raw, 'system');
  const details = requireField<Record<string, unknown>>(system, 'details');
  const levelData = requireField<{ value: number }>(details, 'level');
  const level = levelData.value;

  if (typeof level !== 'number' || level < 1) {
    throw new ImportError('Invalid level value in system.details.level.value', 'system.details.level.value');
  }

  const items = (raw.items ?? []) as Record<string, unknown>[];

  // Find class item
  const classItem = items.find((i) => (i as { type: string }).type === 'class') as FoundryClassItem | undefined;
  if (!classItem) {
    throw new ImportError('Missing class item in Foundry JSON items array', 'items[class]');
  }

  // Resolve key ability
  const keyAbilityData = classItem.system?.keyAbility;
  if (!keyAbilityData) {
    throw new ImportError('Missing class keyAbility in Foundry JSON', 'items[class].system.keyAbility');
  }
  const keyAbility = resolveKeyAbility(keyAbilityData);

  // Ancestry item
  const ancestryItem = items.find((i) => (i as { type: string }).type === 'ancestry') as {
    name: string;
  } | undefined;
  const ancestryName = ancestryItem?.name ?? '';

  // Heritage item
  const heritageItem = items.find((i) => (i as { type: string }).type === 'heritage') as {
    name: string;
  } | undefined;
  const heritageName = heritageItem?.name ?? '';

  // Background item
  const bgItem = items.find((i) => (i as { type: string }).type === 'background') as {
    name: string;
  } | undefined;
  const bgName = bgItem?.name ?? '';

  // Reconstruct abilities
  const systemBuild = (system.build ?? { attributes: { boosts: {} } }) as {
    attributes: { boosts: Record<string, string[]> };
  };
  const abilities = reconstructAbilities(items, systemBuild, keyAbility);

  // Saves
  const savingThrows = classItem.system.savingThrows;
  const saves: NormalizedSaves = {
    fortitude: abilities.con + profBonusFoundry(savingThrows.fortitude, level),
    reflex: abilities.dex + profBonusFoundry(savingThrows.reflex, level),
    will: abilities.wis + profBonusFoundry(savingThrows.will, level),
  };

  // Perception
  const perceptionRank = classItem.system.perception;
  const perception = abilities.wis + profBonusFoundry(perceptionRank, level);

  // Skills
  const systemSkills = (system.skills ?? {}) as Record<string, { rank?: number; value?: number }>;
  const skills = buildSkills(systemSkills, classItem, abilities, level);

  // Weapons
  const weapons = buildWeapons(items, abilities, classItem, level);

  // HP
  const classHp = classItem.system.hp;
  const ancestryItemTyped = items.find((i) => (i as { type: string }).type === 'ancestry') as {
    system?: { hp?: number };
  } | undefined;
  const ancestryHp = ancestryItemTyped?.system?.hp ?? 0;
  const maxHp = classHp * level + ancestryHp + abilities.con * level;
  const currentHp = (system.attributes as Record<string, unknown> | undefined)
    ? (((system.attributes as Record<string, unknown>).hp as Record<string, unknown>)?.value as number ?? maxHp)
    : maxHp;

  // AC (not reliably available from Foundry export; use 10 + DEX + level as placeholder)
  const ac = 0; // Will be computed by the UI from armor items in future phases

  // Class DC
  const keyAbilMod = abilities[keyAbility];
  const classDC = 10 + keyAbilMod + profBonusFoundry(1, level); // class DC: trained + key ability

  // Spellcasters
  const spellcasters = buildSpellcasters(items, abilities, level);

  // Feats
  const feats = buildFeats(items);

  return {
    name,
    class: classItem.name,
    level,
    ancestry: ancestryName,
    heritage: heritageName,
    background: bgName,
    keyAbility,
    sourceFormat: 'foundry',
    importedAt: new Date(),
    abilities,
    saves,
    perception,
    maxHp,
    currentHp,
    ac,
    classDC,
    skills,
    weapons,
    spellcasters,
    feats,
  };
}
