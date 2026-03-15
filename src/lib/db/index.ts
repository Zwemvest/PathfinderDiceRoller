import Dexie, { type Table } from 'dexie';
import type { NormalizedCharacter } from '$lib/parsers/types';

// ─── Stored character (NormalizedCharacter + Dexie id) ───────────────────────

export interface StoredCharacter extends NormalizedCharacter {
	id?: number;
}

// ─── Phase 1 legacy interfaces (kept so existing tests don't break) ───────────

/**
 * @deprecated Use StoredCharacter instead. Kept for db.browser.test.ts compatibility.
 */
export interface Character {
	id?: number;
	importedAt: Date;
	name: string;
	raw: string; // raw JSON blob, replaced by NormalizedCharacter in v2
}

/**
 * @deprecated Use RollSnapshot instead. Kept for db.browser.test.ts compatibility.
 */
export interface RollHistoryEntry {
	id?: number;
	rolledAt: Date;
	expression: string;
	result: number;
}

// ─── Roll snapshot (Phase 4) ──────────────────────────────────────────────────

export interface RollSnapshot {
	id?: number;
	rolledAt: Date;
	characterName: string;   // "Knurvik" or "Free-form"
	label: string;           // "Athletics", "Fortitude", "2d8+4"
	rollType: 'skill' | 'save' | 'perception' | 'initiative' | 'free-form';
	notation: string;        // "1d20+15"
	dieResults: number[];    // raw die faces
	naturalDie: number;      // first die (d20 face for checks)
	modifierTotal: number;   // net modifier
	total: number;           // final roll total
	keptModifiers: string;   // JSON-serialized kept[] for breakdown display
	dc: number | null;
	degree: string | null;   // DegreeOfSuccess string or null
	shifted: boolean;
	shiftDirection: string | null; // 'up' | 'down' | null
}

export interface Settings {
	id?: number;
	key: string;
	value: string;
}

export interface HeroPoint {
	id?: number;
	characterId: number;
	count: number;
}

// ─── Database class ───────────────────────────────────────────────────────────

class AppDatabase extends Dexie {
	characters!: Table<StoredCharacter>;
	rollHistory!: Table<RollSnapshot>;
	settings!: Table<Settings>;
	heroPoints!: Table<HeroPoint>;

	constructor() {
		super('PathfinderDiceRoller');

		// v1 schema (Phase 1 placeholder — characters stored raw JSON strings)
		this.version(1).stores({
			characters: '++id, name, importedAt',
			rollHistory: '++id, rolledAt',
			settings: '++id, key',
			heroPoints: '++id, characterId'
		});

		// v2 schema (Phase 2 — characters store NormalizedCharacter)
		// Clears old character data on upgrade (v1 data was placeholder only)
		this.version(2)
			.stores({
				characters: '++id, name, importedAt, sourceFormat',
				rollHistory: '++id, rolledAt',
				settings: '++id, key',
				heroPoints: '++id, characterId'
			})
			.upgrade((tx) => {
				return tx.table('characters').clear();
			});

		// v3 schema (Phase 4 — rollHistory stores RollSnapshot)
		// No upgrade callback needed: old entries with missing fields render
		// gracefully with nullish checks or are cleared by clearRollHistory().
		this.version(3).stores({
			characters: '++id, name, importedAt, sourceFormat',
			rollHistory: '++id, rolledAt',
			settings: '++id, key',
			heroPoints: '++id, characterId'
		});
	}
}

export const db = new AppDatabase();

// ─── CRUD helpers ─────────────────────────────────────────────────────────────

/**
 * Save a character to the database.
 * If the character has an id, it updates the existing record (put/upsert).
 * If no id, it inserts a new record.
 * Returns the id of the saved character.
 */
export async function saveCharacter(char: StoredCharacter): Promise<number> {
	return db.characters.put(char) as Promise<number>;
}

/**
 * Retrieve a single character by id.
 * Returns undefined if not found.
 */
export async function getCharacter(id: number): Promise<StoredCharacter | undefined> {
	return db.characters.get(id);
}

/**
 * Retrieve all stored characters.
 */
export async function getAllCharacters(): Promise<StoredCharacter[]> {
	return db.characters.toArray();
}

/**
 * Delete a character by id.
 */
export async function deleteCharacter(id: number): Promise<void> {
	return db.characters.delete(id);
}

/**
 * Find a character by name (case-sensitive exact match).
 * Used for re-import matching.
 * Returns undefined if no match.
 */
export async function findCharacterByName(name: string): Promise<StoredCharacter | undefined> {
	return db.characters.where('name').equals(name).first();
}

/**
 * Get the id of the currently active character from the settings table.
 * Returns null if no active character is set.
 */
export async function getActiveCharacterId(): Promise<number | null> {
	const entry = await db.settings.where('key').equals('activeCharacterId').first();
	if (!entry) return null;
	const id = parseInt(entry.value, 10);
	return isNaN(id) ? null : id;
}

/**
 * Persist the active character id to the settings table.
 */
export async function setActiveCharacterId(id: number): Promise<void> {
	const existing = await db.settings.where('key').equals('activeCharacterId').first();
	if (existing) {
		await db.settings.update(existing.id!, { value: String(id) });
	} else {
		await db.settings.add({ key: 'activeCharacterId', value: String(id) });
	}
}
