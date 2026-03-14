<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import ImportZone from '$lib/components/import/ImportZone.svelte';
	import {
		getActiveCharacterId,
		getCharacter,
		type StoredCharacter
	} from '$lib/db/index';

	// ─── State ────────────────────────────────────────────────────────────────

	let activeCharacter = $state<StoredCharacter | null>(null);
	let loading = $state(true);

	// ─── Load active character on mount ──────────────────────────────────────

	$effect(() => {
		if (!browser) {
			loading = false;
			return;
		}

		(async () => {
			try {
				const id = await getActiveCharacterId();
				if (id !== null) {
					const char = await getCharacter(id);
					activeCharacter = char ?? null;
				}
			} finally {
				loading = false;
			}
		})();
	});
</script>

<div class="flex flex-col h-full p-4">

	{#if loading}
		<!-- Loading state -->
		<div class="flex flex-1 items-center justify-center">
			<div class="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
		</div>

	{:else if activeCharacter === null}
		<!-- No character — show import zone -->
		<div class="flex flex-col flex-1 items-center justify-center gap-2 text-center pt-4">
			<span class="text-5xl mb-2" aria-hidden="true">🛡️</span>
			<h1 class="text-text-primary text-2xl font-semibold">Import a Character</h1>
			<p class="text-text-muted text-sm mb-4">Pick your format, then select a JSON export file</p>
			<ImportZone />
		</div>

	{:else}
		<!-- Active character dashboard (placeholder — full UI in Plan 03) -->
		<div class="flex flex-col gap-4">
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-text-primary text-xl font-semibold">{activeCharacter.name}</h1>
					<p class="text-text-muted text-sm">
						Level {activeCharacter.level} {activeCharacter.class} · {activeCharacter.ancestry}
					</p>
				</div>

				<!-- Navigate to character list -->
				<a
					href="{base}/characters"
					class="text-xs text-accent underline"
				>
					All Characters
				</a>
			</div>

			<!-- Quick stats placeholder -->
			<div class="grid grid-cols-3 gap-3">
				<div class="bg-surface-raised rounded-lg p-3 text-center">
					<p class="text-xl font-bold text-text-primary">{activeCharacter.maxHp}</p>
					<p class="text-xs text-text-muted">Max HP</p>
				</div>
				<div class="bg-surface-raised rounded-lg p-3 text-center">
					<p class="text-xl font-bold text-text-primary">{activeCharacter.ac}</p>
					<p class="text-xs text-text-muted">AC</p>
				</div>
				<div class="bg-surface-raised rounded-lg p-3 text-center">
					<p class="text-xl font-bold text-text-primary">{activeCharacter.perception >= 0 ? '+' : ''}{activeCharacter.perception}</p>
					<p class="text-xs text-text-muted">Perception</p>
				</div>
			</div>

			<p class="text-xs text-text-muted text-center">
				Full character sheet coming in the next update
			</p>

			<!-- Navigate to character list -->
			<a
				href="{base}/characters"
				class="text-sm text-center text-accent underline"
			>
				Manage Characters
			</a>
		</div>

		<!-- FAB: import additional character -->
		<button
			type="button"
			class="fixed bottom-32 right-4 w-12 h-12 rounded-full bg-accent text-white shadow-lg flex items-center justify-center text-xl"
			aria-label="Import another character"
			onclick={() => goto(`${base}/characters`)}
		>
			+
		</button>
	{/if}

</div>
