<script lang="ts">
	import type { NormalizedWeapon } from '$lib/parsers/types';
	import CollapsibleSection from './CollapsibleSection.svelte';

	interface Props {
		weapons: NormalizedWeapon[];
	}

	let { weapons }: Props = $props();

	function formatMod(n: number): string {
		return n >= 0 ? `+${n}` : `${n}`;
	}

	function damageExpression(w: NormalizedWeapon): string {
		const base = `${w.damageDice}${w.damageDie}`;
		const bonus = w.damageBonus !== 0 ? (w.damageBonus > 0 ? `+${w.damageBonus}` : `${w.damageBonus}`) : '';
		// Abbreviate damage type
		const typeAbbr: Record<string, string> = {
			bludgeoning: 'B',
			piercing: 'P',
			slashing: 'S',
			fire: 'Fire',
			cold: 'Cold',
			electricity: 'Elec',
			acid: 'Acid',
			sonic: 'Sonic',
			force: 'Force',
			mental: 'Mental',
			poison: 'Poison',
		};
		const dmgType = typeAbbr[w.damageType] ?? w.damageType;
		return `${base}${bonus} ${dmgType}`;
	}

	// Build the display string for a weapon: "+N Name" or "Name +N" format
	function weaponDisplay(w: NormalizedWeapon): string {
		return `${w.name} ${formatMod(w.attackBonus)}`;
	}
</script>

<CollapsibleSection title="Attacks" defaultOpen={true} count={weapons.length}>
	{#if weapons.length === 0}
		<p class="text-text-muted text-sm text-center py-2">No weapons</p>
	{:else}
		<div class="space-y-2">
			{#each weapons as weapon}
				<div class="bg-surface-overlay rounded-lg px-3 py-2">
					<p class="text-text-primary text-sm font-semibold">{weaponDisplay(weapon)}</p>
					<p class="text-text-muted text-xs mt-0.5">{damageExpression(weapon)}</p>
					{#if weapon.extraDamage.length > 0}
						<p class="text-text-muted text-xs">{weapon.extraDamage.join(', ')}</p>
					{/if}
					{#if weapon.traits.length > 0}
						<p class="text-text-muted text-[0.65rem] mt-0.5 italic">{weapon.traits.join(', ')}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</CollapsibleSection>
