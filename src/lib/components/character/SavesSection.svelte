<script lang="ts">
	import type { NormalizedSaves } from '$lib/parsers/types';
	import CollapsibleSection from './CollapsibleSection.svelte';

	interface Props {
		saves: NormalizedSaves;
	}

	let { saves }: Props = $props();

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
			<div class="bg-surface-overlay rounded-lg p-3 text-center">
				<p class="text-text-primary text-xl font-bold leading-none">{formatMod(save.value)}</p>
				<p class="text-text-muted text-xs mt-1">{save.label}</p>
			</div>
		{/each}
	</div>
</CollapsibleSection>
