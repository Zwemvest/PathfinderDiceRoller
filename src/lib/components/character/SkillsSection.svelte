<script lang="ts">
	import type { NormalizedSkill } from '$lib/parsers/types';
	import CollapsibleSection from './CollapsibleSection.svelte';

	interface Props {
		skills: NormalizedSkill[];
	}

	let { skills }: Props = $props();

	function formatMod(n: number): string {
		return n >= 0 ? `+${n}` : `${n}`;
	}

	// Sort: standard skills alphabetically first, then lore skills alphabetically
	const sortedSkills = $derived(
		[...skills].sort((a, b) => {
			const aIsLore = a.slug.endsWith('-lore') || a.label.toLowerCase().includes('lore');
			const bIsLore = b.slug.endsWith('-lore') || b.label.toLowerCase().includes('lore');
			if (aIsLore !== bIsLore) return aIsLore ? 1 : -1;
			return a.label.localeCompare(b.label);
		})
	);
</script>

<CollapsibleSection title="Skills" defaultOpen={true} count={skills.length}>
	<div class="grid grid-cols-2 gap-x-4 gap-y-1">
		{#each sortedSkills as skill}
			{@const untrained = skill.proficiencyRank === 0}
			<div class="flex justify-between items-center py-0.5">
				<span class="text-sm {untrained ? 'text-text-muted' : 'text-text-primary'} truncate mr-1">
					{skill.label}
				</span>
				<span class="text-sm font-semibold shrink-0 {untrained ? 'text-text-muted' : 'text-text-primary'}">
					{formatMod(skill.total)}
				</span>
			</div>
		{/each}
	</div>
</CollapsibleSection>
