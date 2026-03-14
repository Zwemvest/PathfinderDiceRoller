<script lang="ts">
	import type { NormalizedFeat, FeatCategory } from '$lib/parsers/types';
	import CollapsibleSection from './CollapsibleSection.svelte';

	interface Props {
		feats: NormalizedFeat[];
	}

	let { feats }: Props = $props();

	// Display labels for categories
	const categoryLabel: Record<FeatCategory, string> = {
		class: 'Class Feats',
		ancestry: 'Ancestry Feats',
		general: 'General Feats',
		skill: 'Skill Feats',
		archetype: 'Archetype Feats',
		bonus: 'Bonus Feats',
		heritage: 'Heritage Feats',
		classfeature: 'Class Features',
		other: 'Other',
	};

	// Preferred display order
	const categoryOrder: FeatCategory[] = [
		'classfeature',
		'class',
		'ancestry',
		'heritage',
		'general',
		'skill',
		'archetype',
		'bonus',
		'other',
	];

	// Group feats by category
	const groupedFeats = $derived((): { category: FeatCategory; label: string; names: string[] }[] => {
		const groups = new Map<FeatCategory, string[]>();
		for (const feat of feats) {
			if (!groups.has(feat.category)) groups.set(feat.category, []);
			groups.get(feat.category)!.push(feat.name);
		}

		// Sort each group alphabetically
		for (const [, names] of groups) {
			names.sort((a, b) => a.localeCompare(b));
		}

		// Return in preferred order, then any remaining
		const result: { category: FeatCategory; label: string; names: string[] }[] = [];
		const seen = new Set<FeatCategory>();

		for (const cat of categoryOrder) {
			if (groups.has(cat)) {
				result.push({ category: cat, label: categoryLabel[cat], names: groups.get(cat)! });
				seen.add(cat);
			}
		}

		// Any categories not in preferred order
		for (const [cat, names] of groups) {
			if (!seen.has(cat)) {
				result.push({ category: cat, label: categoryLabel[cat] ?? cat, names });
			}
		}

		return result;
	});
</script>

<!-- Feats default to collapsed — least frequently referenced in play -->
<CollapsibleSection title="Feats & Features" defaultOpen={false} count={feats.length}>
	{#if feats.length === 0}
		<p class="text-text-muted text-sm text-center py-2">No feats</p>
	{:else}
		<div class="space-y-3">
			{#each groupedFeats() as group}
				<div>
					<p class="text-text-muted text-xs font-semibold uppercase tracking-wide mb-1">
						{group.label}
					</p>
					<ul class="space-y-0.5">
						{#each group.names as name}
							<li class="text-text-primary text-sm">{name}</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	{/if}
</CollapsibleSection>
