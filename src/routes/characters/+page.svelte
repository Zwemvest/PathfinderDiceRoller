<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import CharacterCard from '$lib/components/character/CharacterCard.svelte';
	import ImportZone from '$lib/components/import/ImportZone.svelte';
	import {
		getAllCharacters,
		deleteCharacter,
		setActiveCharacterId,
		getActiveCharacterId,
		type StoredCharacter
	} from '$lib/db/index';

	// ─── State ────────────────────────────────────────────────────────────────

	let characters = $state<StoredCharacter[]>([]);
	let activeId = $state<number | null>(null);
	let loading = $state(true);

	// ─── Load characters on mount ─────────────────────────────────────────────

	$effect(() => {
		if (!browser) {
			loading = false;
			return;
		}

		(async () => {
			try {
				[characters, activeId] = await Promise.all([
					getAllCharacters(),
					getActiveCharacterId()
				]);
			} finally {
				loading = false;
			}
		})();
	});

	// ─── Actions ──────────────────────────────────────────────────────────────

	async function handleSelect(id: number): Promise<void> {
		await setActiveCharacterId(id);
		goto(`${base}/character`);
	}

	async function handleDelete(id: number, name: string): Promise<void> {
		// Native confirm dialog per plan spec
		const ok = confirm(`Delete ${name}? This cannot be undone.`);
		if (!ok) return;

		await deleteCharacter(id);
		characters = characters.filter((c) => c.id !== id);

		// Clear active if we deleted the active character
		if (activeId === id) {
			activeId = null;
		}
	}
</script>

<div class="flex flex-col h-full">

	<!-- Header -->
	<header class="flex items-center gap-3 px-4 pt-4 pb-2 border-b border-surface-raised">
		<a
			href="{base}/character"
			class="text-text-muted text-sm flex items-center gap-1"
			aria-label="Back to character"
		>
			← Back
		</a>
		<h1 class="text-text-primary text-lg font-semibold flex-1">My Characters</h1>
	</header>

	<!-- Content -->
	<div class="flex-1 overflow-y-auto p-4">

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<div class="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
			</div>

		{:else if characters.length === 0}
			<!-- Empty state — show import zone -->
			<div class="flex flex-col items-center gap-2 text-center pt-4">
				<span class="text-4xl mb-2" aria-hidden="true">🛡️</span>
				<p class="text-text-muted text-sm mb-4">No characters yet. Import one to get started.</p>
				<ImportZone />
			</div>

		{:else}
			<!-- Character grid -->
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				{#each characters as character (character.id)}
					<CharacterCard
						{character}
						isActive={character.id === activeId}
						onSelect={() => handleSelect(character.id!)}
						onDelete={() => handleDelete(character.id!, character.name)}
					/>
				{/each}
			</div>

			<!-- Import another button -->
			<div class="mt-6 flex flex-col items-center">
				<p class="text-xs text-text-muted mb-3">Import another character</p>
				<div class="w-full max-w-sm">
					<ImportZone />
				</div>
			</div>
		{/if}

	</div>

</div>
