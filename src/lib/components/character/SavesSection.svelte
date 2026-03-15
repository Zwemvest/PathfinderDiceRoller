<script lang="ts">
	import type { NormalizedSaves } from '$lib/parsers/types';
	import CollapsibleSection from './CollapsibleSection.svelte';
	import { openPreRollDialog } from '$lib/state/roll.svelte';

	interface Props {
		saves: NormalizedSaves;
		characterName: string;
	}

	let { saves, characterName }: Props = $props();

	function formatMod(n: number): string {
		return n >= 0 ? `+${n}` : `${n}`;
	}

	const saveItems = $derived([
		{ label: 'Fortitude', value: saves.fortitude },
		{ label: 'Reflex', value: saves.reflex },
		{ label: 'Will', value: saves.will },
	]);
</script>

<CollapsibleSection title="Saves" defaultOpen={true}>
	<div class="grid grid-cols-3 gap-2">
		{#each saveItems as save}
			<button
				type="button"
				onclick={() => openPreRollDialog(save.label, save.value, 'save', characterName)}
				class="bg-surface-overlay rounded-lg p-3 text-center hover:bg-surface-overlay/70 transition-colors w-full"
			>
				<p class="text-text-primary text-xl font-bold leading-none">{formatMod(save.value)}</p>
				<p class="text-text-muted text-xs mt-1">{save.label}</p>
			</button>
		{/each}
	</div>
</CollapsibleSection>
