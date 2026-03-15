<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/db';
	import type { RollSnapshot } from '$lib/db';
	import { browser } from '$app/environment';
	import { clearRollHistory } from '$lib/db/roll-helpers';
	import HistoryEntry from '$lib/components/rolling/HistoryEntry.svelte';

	let rolls = $state<RollSnapshot[]>([]);
	let listEl = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (!browser) return;
		const obs = liveQuery(() =>
			db.rollHistory.orderBy('rolledAt').reverse().limit(100).toArray()
		);
		const sub = obs.subscribe({ next: (data) => { rolls = data as RollSnapshot[]; } });
		return () => sub.unsubscribe();
	});

	// Auto-scroll to bottom (newest entry) when rolls change
	$effect(() => {
		// Track rolls.length to trigger scroll on new roll
		const _len = rolls.length;
		if (listEl && _len > 0) {
			// column-reverse flips the visual order so "bottom" in DOM = top visually
			// scrollTop = 0 is the visual bottom in a column-reverse flex
			listEl.scrollTop = 0;
		}
	});

	async function handleClearHistory() {
		const confirmed = confirm('Clear all roll history? This cannot be undone.');
		if (confirmed) {
			await clearRollHistory();
		}
	}
</script>

<div class="flex flex-col h-full">
	<!-- Header -->
	<div class="flex items-center justify-between px-4 py-3 border-b border-surface-overlay shrink-0">
		<h1 class="text-text-primary text-lg font-semibold">Roll History</h1>
		{#if rolls.length > 0}
			<button
				type="button"
				onclick={handleClearHistory}
				class="text-sm px-3 py-1 rounded bg-accent text-white font-medium hover:bg-accent-muted transition-colors"
			>
				Clear History
			</button>
		{/if}
	</div>

	<!-- Scrollable roll list -->
	{#if rolls.length === 0}
		<!-- Empty state -->
		<div class="flex flex-col items-center justify-center flex-1 p-6 text-center">
			<span class="text-5xl mb-4" aria-hidden="true">🎲</span>
			<p class="text-text-muted text-base">No rolls yet</p>
			<p class="text-text-muted text-sm mt-1">Roll a skill, save, or use the dice tray to get started.</p>
		</div>
	{:else}
		<!--
			column-reverse: visually flips the list so newest rolls appear at the bottom.
			liveQuery returns newest-first (DESC), column-reverse flips them to newest-at-bottom.
			scrollTop = 0 is therefore the visual bottom, which is where new rolls appear.
		-->
		<div
			bind:this={listEl}
			class="flex-1 overflow-y-auto flex flex-col-reverse"
		>
			<div>
				{#each rolls as snapshot (snapshot.id)}
					<HistoryEntry {snapshot} />
				{/each}
			</div>
		</div>
	{/if}
</div>
