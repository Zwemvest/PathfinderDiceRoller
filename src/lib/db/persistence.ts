import { browser } from '$app/environment';
import { db } from './index';

export async function requestPersistentStorage(): Promise<void> {
	if (!browser || !navigator.storage?.persist) return;

	const alreadyRequested = await db.settings.where('key').equals('persistenceRequested').first();
	if (alreadyRequested) return;

	await navigator.storage.persist();
	await db.settings.add({ key: 'persistenceRequested', value: 'true' });
}
