<script lang="ts">
	import type { NormalizedCharacter, AbilitySlug } from '$lib/parsers/types';

	interface Props {
		character: NormalizedCharacter;
	}

	let { character }: Props = $props();

	// Ability display config
	const abilityOrder: { slug: AbilitySlug; label: string }[] = [
		{ slug: 'str', label: 'STR' },
		{ slug: 'dex', label: 'DEX' },
		{ slug: 'con', label: 'CON' },
		{ slug: 'int', label: 'INT' },
		{ slug: 'wis', label: 'WIS' },
		{ slug: 'cha', label: 'CHA' },
	];

	function formatMod(n: number): string {
		return n >= 0 ? `+${n}` : `${n}`;
	}

	// HP bar width as percentage, capped 0-100
	const hpPercent = $derived(
		character.maxHp > 0
			? Math.min(100, Math.max(0, Math.round((character.currentHp / character.maxHp) * 100)))
			: 0
	);

	const hpBarColor = $derived(
		hpPercent > 66 ? 'bg-green-500' : hpPercent > 33 ? 'bg-yellow-500' : 'bg-red-500'
	);
</script>

<div class="bg-surface-raised rounded-lg p-4 space-y-3">
	<!-- Row 1: Name + Class/Level badge -->
	<div class="flex items-start justify-between gap-2">
		<h1 class="text-text-primary text-xl font-bold leading-tight">{character.name}</h1>
		<span class="shrink-0 bg-surface-overlay text-text-primary text-xs font-semibold px-2 py-1 rounded-full">
			{character.class} {character.level}
		</span>
	</div>

	<!-- Row 2: Ancestry / Heritage / Background -->
	<p class="text-text-muted text-xs">
		{character.ancestry}{character.heritage ? ` · ${character.heritage}` : ''}{character.background ? ` · ${character.background}` : ''}
	</p>

	<!-- Row 3: Ability modifier chips -->
	<div class="flex flex-wrap gap-1.5">
		{#each abilityOrder as { slug, label }}
			{@const isKey = slug === character.keyAbility}
			<div
				class="flex flex-col items-center px-2 py-1 rounded text-xs font-semibold min-w-[2.75rem] {isKey
					? 'bg-accent text-white'
					: 'bg-surface-overlay text-text-primary'}"
			>
				<span>{formatMod(character.abilities[slug])}</span>
				<span class="text-[0.6rem] font-normal {isKey ? 'text-white/80' : 'text-text-muted'}">{label}</span>
			</div>
		{/each}
	</div>

	<!-- Row 4: HP bar + AC + Perception -->
	<div class="space-y-2">
		<!-- HP bar -->
		<div class="space-y-1">
			<div class="flex justify-between items-center">
				<span class="text-text-muted text-xs">HP</span>
				<span class="text-text-primary text-xs font-semibold">
					{character.currentHp} / {character.maxHp}
				</span>
			</div>
			<div class="h-2 bg-surface-overlay rounded-full overflow-hidden">
				<div
					class="h-full rounded-full transition-all {hpBarColor}"
					style="width: {hpPercent}%"
				></div>
			</div>
		</div>

		<!-- AC + Perception badges -->
		<div class="flex gap-2">
			<div class="flex-1 bg-surface-overlay rounded-lg p-2 text-center">
				<p class="text-text-primary text-lg font-bold leading-none">{character.ac}</p>
				<p class="text-text-muted text-xs mt-0.5">AC</p>
			</div>
			<div class="flex-1 bg-surface-overlay rounded-lg p-2 text-center">
				<p class="text-text-primary text-lg font-bold leading-none">{formatMod(character.perception)}</p>
				<p class="text-text-muted text-xs mt-0.5">Perception</p>
			</div>
			{#if character.classDC > 0}
				<div class="flex-1 bg-surface-overlay rounded-lg p-2 text-center">
					<p class="text-text-primary text-lg font-bold leading-none">{character.classDC}</p>
					<p class="text-text-muted text-xs mt-0.5">Class DC</p>
				</div>
			{/if}
		</div>
	</div>
</div>
