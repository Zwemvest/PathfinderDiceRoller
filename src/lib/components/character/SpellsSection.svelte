<script lang="ts">
	import type { NormalizedSpellcaster } from '$lib/parsers/types';
	import CollapsibleSection from './CollapsibleSection.svelte';

	interface Props {
		spellcasters: NormalizedSpellcaster[];
		totalFocusPoints?: number;
	}

	let { spellcasters, totalFocusPoints = 0 }: Props = $props();

	// Capitalize first letter
	function capitalize(s: string): string {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}

	function formatMod(n: number): string {
		return n >= 0 ? `+${n}` : `${n}`;
	}

	// Group spells by level for a spellcaster
	function spellsByLevel(caster: NormalizedSpellcaster): Map<number, string[]> {
		const map = new Map<number, string[]>();
		const source = caster.prepared ?? caster.spells;
		for (const spell of source) {
			const lvl = spell.level;
			if (!map.has(lvl)) map.set(lvl, []);
			map.get(lvl)!.push(spell.name);
		}
		// Sort by level
		return new Map([...map.entries()].sort(([a], [b]) => a - b));
	}

	const totalSpellCount = $derived(
		spellcasters.reduce((sum, c) => {
			const source = c.prepared ?? c.spells;
			return sum + source.length;
		}, 0)
	);
</script>

<CollapsibleSection title="Spells" defaultOpen={true} count={totalSpellCount > 0 ? totalSpellCount : undefined}>
	{#if spellcasters.length === 0}
		<p class="text-text-muted text-sm text-center py-2">No spells</p>
	{:else}
		<div class="space-y-4">
			{#each spellcasters as caster}
				<!-- Sub-section header for each tradition -->
				<div>
					{#if spellcasters.length > 1}
						<div class="flex items-center justify-between mb-2">
							<p class="text-text-muted text-xs font-semibold uppercase tracking-wide">
								{capitalize(caster.tradition)} · {capitalize(caster.spellcastingType)}
							</p>
							<div class="flex gap-2 text-xs text-text-muted">
								<span>Atk {formatMod(caster.spellAttack)}</span>
								<span>DC {caster.spellDC}</span>
							</div>
						</div>
					{:else}
						<div class="flex items-center justify-between mb-2">
							<p class="text-text-muted text-xs font-semibold uppercase tracking-wide">
								{capitalize(caster.tradition)} · {capitalize(caster.spellcastingType)}
							</p>
							<div class="flex gap-2 text-xs text-text-muted">
								<span>Atk {formatMod(caster.spellAttack)}</span>
								<span>DC {caster.spellDC}</span>
							</div>
						</div>
					{/if}

					<!-- Spells grouped by level -->
					{#each [...spellsByLevel(caster).entries()] as [lvl, names]}
						<div class="mb-2">
							<p class="text-text-muted text-xs mb-1">
								{lvl === 0 ? 'Cantrips' : `Level ${lvl}`}
								{#if caster.perDay[lvl] !== undefined && caster.perDay[lvl] > 0 && caster.spellcastingType !== 'innate'}
									<span class="text-text-muted/60">({caster.perDay[lvl]}/day)</span>
								{/if}
							</p>
							<div class="flex flex-wrap gap-1">
								{#each names as spellName}
									<span class="bg-surface-overlay text-text-primary text-xs px-2 py-0.5 rounded">
										{spellName}
									</span>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/each}

			<!-- Focus points indicator -->
			{#if totalFocusPoints > 0}
				<p class="text-text-muted text-xs text-right">
					Focus Points: {totalFocusPoints}
				</p>
			{:else if spellcasters.some(c => c.focusPoints > 0)}
				{@const fp = spellcasters.reduce((sum, c) => sum + c.focusPoints, 0)}
				{#if fp > 0}
					<p class="text-text-muted text-xs text-right">Focus Points: {fp}</p>
				{/if}
			{/if}
		</div>
	{/if}
</CollapsibleSection>
