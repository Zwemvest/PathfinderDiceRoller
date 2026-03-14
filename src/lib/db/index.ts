import Dexie, { type Table } from 'dexie';

// Phase 1 placeholder interfaces — fields expanded in later phases

export interface Character {
	id?: number;
	importedAt: Date;
	name: string;
	raw: string; // raw JSON blob, parsed in Phase 2
}

export interface RollHistoryEntry {
	id?: number;
	rolledAt: Date;
	expression: string;
	result: number;
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

class AppDatabase extends Dexie {
	characters!: Table<Character>;
	rollHistory!: Table<RollHistoryEntry>;
	settings!: Table<Settings>;
	heroPoints!: Table<HeroPoint>;

	constructor() {
		super('PathfinderDiceRoller');
		this.version(1).stores({
			characters: '++id, name, importedAt',
			rollHistory: '++id, rolledAt',
			settings: '++id, key',
			heroPoints: '++id, characterId'
		});
	}
}

export const db = new AppDatabase();
