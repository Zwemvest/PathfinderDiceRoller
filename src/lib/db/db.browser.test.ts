import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dexie, { type Table } from 'dexie';
import type { Character, RollHistoryEntry, Settings } from './index';

// Use a test-specific database to avoid polluting app data
interface TestDB {
	characters: Table<Character>;
	rollHistory: Table<RollHistoryEntry>;
	settings: Table<Settings>;
}

class TestDatabase extends Dexie {
	characters!: Table<Character>;
	rollHistory!: Table<RollHistoryEntry>;
	settings!: Table<Settings>;

	constructor() {
		super('PathfinderDiceRollerTest_' + Date.now());
		this.version(1).stores({
			characters: '++id, name, importedAt',
			rollHistory: '++id, rolledAt',
			settings: '++id, key'
		});
	}
}

let testDb: TestDatabase;

beforeEach(async () => {
	testDb = new TestDatabase();
	await testDb.open();
});

afterEach(async () => {
	const dbName = testDb.name;
	await testDb.close();
	await Dexie.delete(dbName);
});

describe('Dexie database', () => {
	it('opens successfully', async () => {
		expect(testDb.isOpen()).toBe(true);
	});

	it('can add and retrieve a settings entry', async () => {
		await testDb.settings.add({ key: 'theme', value: 'dark' });

		const retrieved = await testDb.settings.where('key').equals('theme').first();

		expect(retrieved).toBeDefined();
		expect(retrieved?.key).toBe('theme');
		expect(retrieved?.value).toBe('dark');
	});

	it('can add and retrieve a character entry', async () => {
		const character: Character = {
			importedAt: new Date('2026-01-01'),
			name: 'Seoni the Sorcerer',
			raw: JSON.stringify({ level: 5, class: 'Sorcerer' })
		};

		const id = await testDb.characters.add(character);
		expect(id).toBeGreaterThan(0);

		const retrieved = await testDb.characters.get(id);
		expect(retrieved).toBeDefined();
		expect(retrieved?.name).toBe('Seoni the Sorcerer');
		expect(retrieved?.raw).toBe(character.raw);
	});

	it('data persists after closing and reopening the database', async () => {
		// Add data
		await testDb.settings.add({ key: 'persistenceTest', value: 'survives' });

		// Close and reopen with same name
		const dbName = testDb.name;
		await testDb.close();

		const reopened = new Dexie(dbName) as Dexie & { settings: Table<Settings> };
		reopened.version(1).stores({ settings: '++id, key' });
		await reopened.open();

		const retrieved = await reopened
			.table<Settings>('settings')
			.where('key')
			.equals('persistenceTest')
			.first();
		expect(retrieved).toBeDefined();
		expect(retrieved?.value).toBe('survives');

		await reopened.close();
		await Dexie.delete(dbName);

		// Reopen testDb fresh to let afterEach cleanup work
		testDb = new TestDatabase();
		await testDb.open();
	});

	it('can add and retrieve a roll history entry', async () => {
		const rollEntry: RollHistoryEntry = {
			rolledAt: new Date(),
			expression: '1d20+5',
			result: 17
		};

		const id = await testDb.rollHistory.add(rollEntry);
		const retrieved = await testDb.rollHistory.get(id);

		expect(retrieved).toBeDefined();
		expect(retrieved?.expression).toBe('1d20+5');
		expect(retrieved?.result).toBe(17);
	});
});
