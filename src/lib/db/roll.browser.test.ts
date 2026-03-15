import { describe, it, expect, beforeEach } from 'vitest';
import { db, type RollSnapshot } from '$lib/db';
import { saveRoll, getRollHistory, clearRollHistory } from '$lib/db/roll-helpers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSnapshot(overrides: Partial<Omit<RollSnapshot, 'id'>> = {}): Omit<RollSnapshot, 'id'> {
	return {
		rolledAt: new Date(),
		characterName: 'Knurvik',
		label: 'Athletics',
		rollType: 'skill',
		notation: '1d20+15',
		dieResults: [12],
		naturalDie: 12,
		modifierTotal: 15,
		total: 27,
		keptModifiers: JSON.stringify([{ label: 'Str', value: 15 }]),
		dc: 20,
		degree: 'success',
		shifted: false,
		shiftDirection: null,
		...overrides
	};
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(async () => {
	await db.rollHistory.clear();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Roll DB operations', () => {
	it('Test 1: saveRoll() stores a RollSnapshot and getRollHistory() returns it with all fields intact', async () => {
		const snapshot = makeSnapshot({ label: 'Fortitude', rollType: 'save', degree: 'critical-success' });
		const id = await saveRoll(snapshot);

		expect(id).toBeGreaterThan(0);

		const history = await getRollHistory();
		expect(history).toHaveLength(1);

		const saved = history[0];
		expect(saved.characterName).toBe('Knurvik');
		expect(saved.label).toBe('Fortitude');
		expect(saved.rollType).toBe('save');
		expect(saved.notation).toBe('1d20+15');
		expect(saved.dieResults).toEqual([12]);
		expect(saved.naturalDie).toBe(12);
		expect(saved.modifierTotal).toBe(15);
		expect(saved.total).toBe(27);
		expect(saved.keptModifiers).toBe(JSON.stringify([{ label: 'Str', value: 15 }]));
		expect(saved.dc).toBe(20);
		expect(saved.degree).toBe('critical-success');
		expect(saved.shifted).toBe(false);
		expect(saved.shiftDirection).toBeNull();
	});

	it('Test 2: saveRoll() auto-prunes oldest entries when count reaches 100 (save 101 entries, verify only 100 remain, verify oldest is pruned)', async () => {
		// Insert 100 entries, oldest has earliest rolledAt
		const base = new Date('2026-01-01T00:00:00Z');

		for (let i = 0; i < 100; i++) {
			const rolledAt = new Date(base.getTime() + i * 1000); // 1 second apart
			await db.rollHistory.add(makeSnapshot({ rolledAt, label: `Roll ${i}` }));
		}

		expect(await db.rollHistory.count()).toBe(100);

		// Save the 101st entry — should trigger pruning
		const newest = makeSnapshot({
			rolledAt: new Date(base.getTime() + 100 * 1000),
			label: 'Roll 100'
		});
		await saveRoll(newest);

		const count = await db.rollHistory.count();
		expect(count).toBe(100);

		// Oldest (Roll 0 at base) must be gone
		const oldest = await db.rollHistory.orderBy('rolledAt').first();
		expect(oldest?.label).not.toBe('Roll 0');

		// Newest must be present
		const history = await getRollHistory();
		expect(history[0].label).toBe('Roll 100');
	});

	it('Test 3: clearRollHistory() removes all entries, getRollHistory() returns empty array', async () => {
		await saveRoll(makeSnapshot({ label: 'First' }));
		await saveRoll(makeSnapshot({ label: 'Second' }));

		expect(await db.rollHistory.count()).toBe(2);

		await clearRollHistory();

		const history = await getRollHistory();
		expect(history).toHaveLength(0);
	});

	it('Test 4: getRollHistory() returns entries ordered by rolledAt descending (newest first)', async () => {
		const t1 = new Date('2026-01-01T10:00:00Z');
		const t2 = new Date('2026-01-01T11:00:00Z');
		const t3 = new Date('2026-01-01T12:00:00Z');

		await db.rollHistory.add(makeSnapshot({ rolledAt: t1, label: 'Oldest' }));
		await db.rollHistory.add(makeSnapshot({ rolledAt: t3, label: 'Newest' }));
		await db.rollHistory.add(makeSnapshot({ rolledAt: t2, label: 'Middle' }));

		const history = await getRollHistory();

		expect(history[0].label).toBe('Newest');
		expect(history[1].label).toBe('Middle');
		expect(history[2].label).toBe('Oldest');
	});

	it('Test 5: RollSnapshot persists across db close/open cycle (IndexedDB persistence)', async () => {
		const snapshot = makeSnapshot({ label: 'Persisted Roll', total: 19 });
		await saveRoll(snapshot);

		// Close and reopen the database
		const dbName = db.name;
		await db.close();

		const Dexie = (await import('dexie')).default;
		const reopened = new Dexie(dbName) as InstanceType<typeof Dexie> & {
			rollHistory: import('dexie').Table<RollSnapshot>;
		};
		reopened.version(3).stores({ rollHistory: '++id, rolledAt' });
		await reopened.open();

		const entries = await reopened.rollHistory.toArray();
		expect(entries).toHaveLength(1);
		expect(entries[0].label).toBe('Persisted Roll');
		expect(entries[0].total).toBe(19);

		await reopened.close();

		// Reopen the app db so afterEach / subsequent tests work
		await db.open();
	});
});
