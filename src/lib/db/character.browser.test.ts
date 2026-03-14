import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dexie from 'dexie';
import type { NormalizedCharacter } from '$lib/parsers/types';
import {
	saveCharacter,
	getCharacter,
	getAllCharacters,
	deleteCharacter,
	findCharacterByName,
	getActiveCharacterId,
	setActiveCharacterId,
	type StoredCharacter,
	db
} from './index';

// ─── Test factory ─────────────────────────────────────────────────────────────

function makeCharacter(overrides: Partial<NormalizedCharacter> = {}): NormalizedCharacter {
	return {
		name: 'Knurvik',
		class: 'Monk',
		level: 1,
		ancestry: 'Dwarf',
		heritage: 'Forge Dwarf',
		background: 'Miner',
		keyAbility: 'str',
		sourceFormat: 'foundry',
		importedAt: new Date('2026-01-01T00:00:00Z'),
		abilities: { str: 3, dex: 1, con: 2, int: 0, wis: 1, cha: -1 },
		saves: { fortitude: 7, reflex: 4, will: 4 },
		perception: 4,
		maxHp: 20,
		currentHp: 20,
		ac: 17,
		classDC: 17,
		skills: [],
		weapons: [],
		spellcasters: [],
		feats: [],
		...overrides
	};
}

// ─── Test isolation ────────────────────────────────────────────────────────────

beforeEach(async () => {
	await db.characters.clear();
	await db.settings.where('key').equals('activeCharacterId').delete();
});

afterEach(async () => {
	await db.characters.clear();
	await db.settings.where('key').equals('activeCharacterId').delete();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('character CRUD', () => {
	it('saves a NormalizedCharacter and retrieves it by id', async () => {
		const char = makeCharacter();
		const id = await saveCharacter(char);

		expect(id).toBeGreaterThan(0);

		const retrieved = await getCharacter(id);
		expect(retrieved).toBeDefined();
		expect(retrieved!.name).toBe('Knurvik');
		expect(retrieved!.class).toBe('Monk');
		expect(retrieved!.level).toBe(1);
		expect(retrieved!.ancestry).toBe('Dwarf');
		expect(retrieved!.abilities.str).toBe(3);
		expect(retrieved!.maxHp).toBe(20);
		expect(retrieved!.sourceFormat).toBe('foundry');
	});

	it('saves two characters and getAllCharacters returns both', async () => {
		await saveCharacter(makeCharacter({ name: 'Knurvik' }));
		await saveCharacter(makeCharacter({ name: 'Seoni', class: 'Sorcerer', keyAbility: 'cha' }));

		const all = await getAllCharacters();
		expect(all).toHaveLength(2);
		const names = all.map((c: StoredCharacter) => c.name);
		expect(names).toContain('Knurvik');
		expect(names).toContain('Seoni');
	});

	it('deletes a character and verifies it is gone', async () => {
		const id = await saveCharacter(makeCharacter());
		await deleteCharacter(id);

		const retrieved = await getCharacter(id);
		expect(retrieved).toBeUndefined();

		const all = await getAllCharacters();
		expect(all).toHaveLength(0);
	});

	it('findCharacterByName returns existing character', async () => {
		await saveCharacter(makeCharacter({ name: 'Knurvik' }));

		const found = await findCharacterByName('Knurvik');
		expect(found).toBeDefined();
		expect(found!.name).toBe('Knurvik');
	});

	it('findCharacterByName returns undefined for unknown name', async () => {
		const found = await findCharacterByName('NonExistent');
		expect(found).toBeUndefined();
	});

	it('re-importing (saveCharacter with same id) overwrites the character', async () => {
		const id = await saveCharacter(makeCharacter({ name: 'Knurvik', level: 1 }));
		const existing = await getCharacter(id);
		expect(existing!.level).toBe(1);

		// Re-import with updated level
		await saveCharacter({ ...makeCharacter({ name: 'Knurvik', level: 2 }), id });
		const updated = await getCharacter(id);
		expect(updated!.level).toBe(2);
	});

	it('setActiveCharacterId persists and getActiveCharacterId retrieves it', async () => {
		const id = await saveCharacter(makeCharacter());
		await setActiveCharacterId(id);

		const activeId = await getActiveCharacterId();
		expect(activeId).toBe(id);
	});

	it('getActiveCharacterId returns null when no active character is set', async () => {
		const activeId = await getActiveCharacterId();
		expect(activeId).toBeNull();
	});

	it('characters persist after db.close() and db.open()', async () => {
		await saveCharacter(makeCharacter({ name: 'Knurvik' }));

		await db.close();
		await db.open();

		const all = await getAllCharacters();
		expect(all).toHaveLength(1);
		expect(all[0].name).toBe('Knurvik');
	});
});
