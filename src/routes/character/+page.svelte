<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import ImportZone from '$lib/components/import/ImportZone.svelte';
	import CharacterDashboard from '$lib/components/character/CharacterDashboard.svelte';
	import SavesSection from '$lib/components/character/SavesSection.svelte';
	import SkillsSection from '$lib/components/character/SkillsSection.svelte';
	import AttacksSection from '$lib/components/character/AttacksSection.svelte';
	import SpellsSection from '$lib/components/character/SpellsSection.svelte';
	import FeatsSection from '$lib/components/character/FeatsSection.svelte';
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

<div class="flex flex-col h-full">

	{#if loading}
		<!-- Loading state -->
		<div class="flex flex-1 items-center justify-center">
			<div class="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
		</div>

	{:else if activeCharacter === null}
		<!-- No character — show import zone -->
		<div class="flex flex-col flex-1 items-center justify-center gap-2 text-center p-4">
			<span class="text-5xl mb-2" aria-hidden="true">🛡️</span>
			<h1 class="text-text-primary text-2xl font-semibold">Import a Character</h1>
			<p class="text-text-muted text-sm mb-4">Pick your format, then select a JSON export file</p>
			<ImportZone />
		</div>

	{:else}
		<!-- Active character — full display -->
		<div class="flex-1 overflow-y-auto px-4 py-4 space-y-3">

			<!-- Top navigation row -->
			<div class="flex items-center justify-end mb-1">
				<a
					href="{base}/characters"
					class="text-xs text-accent underline"
				>
					All Characters
				</a>
			</div>

			<!-- Dashboard (always visible) -->
			<CharacterDashboard character={activeCharacter} />

			<!-- Collapsible sections: Saves, Skills, Attacks, Spells, Feats -->
			<SavesSection saves={activeCharacter.saves} characterName={activeCharacter.name} />

			<SkillsSection skills={activeCharacter.skills} characterName={activeCharacter.name} />

			<AttacksSection weapons={activeCharacter.weapons} />

			<SpellsSection
				spellcasters={activeCharacter.spellcasters}
			/>

			<FeatsSection feats={activeCharacter.feats} />

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
