import { db, type RollSnapshot } from '$lib/db';

// ─── Roll persistence helpers ──────────────────────────────────────────────────

const MAX_ROLL_HISTORY = 100;

/**
 * Save a roll snapshot to IndexedDB.
 * Auto-prunes the oldest entries when the table reaches MAX_ROLL_HISTORY.
 * Returns the id of the newly added entry.
 */
export async function saveRoll(snapshot: Omit<RollSnapshot, 'id'>): Promise<number> {
	const count = await db.rollHistory.count();

	if (count >= MAX_ROLL_HISTORY) {
		// Delete enough oldest entries to make room for the new one
		const excessCount = count - MAX_ROLL_HISTORY + 1;
		const keysToDelete = await db.rollHistory
			.orderBy('rolledAt')
			.limit(excessCount)
			.primaryKeys();
		await db.rollHistory.bulkDelete(keysToDelete);
	}

	return db.rollHistory.add(snapshot as RollSnapshot) as Promise<number>;
}

/**
 * Retrieve roll history ordered by rolledAt descending (newest first).
 */
export async function getRollHistory(limit = 100): Promise<RollSnapshot[]> {
	return db.rollHistory.orderBy('rolledAt').reverse().limit(limit).toArray();
}

/**
 * Clear all roll history entries.
 */
export async function clearRollHistory(): Promise<void> {
	await db.rollHistory.clear();
}
