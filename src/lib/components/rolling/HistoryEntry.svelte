<script lang="ts">
	import type { RollSnapshot } from '$lib/db';
	import { DEGREE_COLORS } from '$lib/engine';
	import type { ModifierEntry } from '$lib/engine';

	interface Props {
		snapshot: RollSnapshot;
	}

	let { snapshot }: Props = $props();

	let expanded = $state(false);

	function formatMod(n: number): string {
		return n >= 0 ? `+${n}` : `${n}`;
	}

	function formatTimestamp(date: Date): string {
		const d = date instanceof Date ? date : new Date(date);
		const now = new Date();
		const isToday =
			d.getFullYear() === now.getFullYear() &&
			d.getMonth() === now.getMonth() &&
			d.getDate() === now.getDate();

		const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		if (isToday) return time;

		const month = d.toLocaleString('default', { month: 'short' });
		const day = d.getDate();
		return `${month} ${day} ${time}`;
	}

	function parsedModifiers(): ModifierEntry[] {
		try {
			return JSON.parse(snapshot.keptModifiers) as ModifierEntry[];
		} catch {
			return [];
		}
	}

	const degreeLabel: Record<string, string> = {
		'critical-success': 'Crit Success',
		'success': 'Success',
		'failure': 'Failure',
		'critical-failure': 'Crit Fail',
	};

	const isFreeForm = $derived(snapshot.rollType === 'free-form');
	const showDegree = $derived(snapshot.degree !== null);
	const isNat20 = $derived(snapshot.naturalDie === 20);
	const isNat1 = $derived(snapshot.naturalDie === 1);
	const degreeBgColor = $derived(
		snapshot.degree ? DEGREE_COLORS[snapshot.degree as keyof typeof DEGREE_COLORS] : null
	);
</script>

<button
	type="button"
	class="w-full text-left px-3 py-2 border-b border-surface-overlay last:border-b-0 transition-colors hover:bg-surface-raised focus:outline-none {expanded ? 'bg-surface-overlay' : 'bg-surface-base'}"
	onclick={() => (expanded = !expanded)}
	aria-expanded={expanded}
>
	<!-- Compact view -->
	<div class="flex items-center gap-2 min-w-0">
		<div class="flex-1 min-w-0">
			<span class="text-sm text-text-primary font-medium truncate">
				{snapshot.characterName}
				<span class="text-text-muted">·</span>
				{snapshot.label}
				{#if !isFreeForm}
					<span class="text-text-muted">{formatMod(snapshot.modifierTotal)}</span>
				{/if}
				= <span class="font-bold">{snapshot.total}</span>
			</span>
		</div>

		<!-- Nat die indicator -->
		{#if isNat20}
			<span class="text-xs font-bold text-yellow-400 shrink-0">NAT 20</span>
		{:else if isNat1}
			<span class="text-xs font-bold text-red-400 shrink-0">NAT 1</span>
		{/if}

		<!-- DoS badge -->
		{#if showDegree && degreeBgColor}
			<span
				class="text-xs font-semibold px-1.5 py-0.5 rounded shrink-0"
				style="background-color: {degreeBgColor}; color: #000;"
			>
				{degreeLabel[snapshot.degree!] ?? snapshot.degree}
			</span>
		{/if}

		<!-- Timestamp -->
		<span class="text-xs text-text-muted shrink-0">
			{formatTimestamp(snapshot.rolledAt)}
		</span>

		<!-- Expand chevron -->
		<span class="text-text-muted text-xs shrink-0 transition-transform {expanded ? 'rotate-90' : ''}">
			▶
		</span>
	</div>

	<!-- Expanded view -->
	{#if expanded}
		<div class="mt-2 pt-2 border-t border-surface-overlay text-xs text-text-muted space-y-1">
			<!-- Notation and die results -->
			<div class="flex gap-2 flex-wrap">
				<span class="font-mono text-text-primary">{snapshot.notation}</span>
				<span>→ [{snapshot.dieResults.join(', ')}]</span>
			</div>

			<!-- Modifier breakdown -->
			{#if parsedModifiers().length > 0}
				<div class="space-y-0.5">
					<span class="text-text-muted uppercase tracking-wide text-[10px]">Modifiers</span>
					{#each parsedModifiers() as mod}
						<div class="flex justify-between">
							<span class="text-text-primary">{mod.label}</span>
							<span class="font-mono {mod.value >= 0 ? 'text-green-400' : 'text-red-400'}">
								{formatMod(mod.value)}
							</span>
						</div>
					{/each}
					<div class="flex justify-between border-t border-surface-overlay pt-0.5">
						<span class="text-text-muted">Net modifier</span>
						<span class="font-mono text-text-primary">{formatMod(snapshot.modifierTotal)}</span>
					</div>
				</div>
			{/if}

			<!-- DC -->
			{#if snapshot.dc !== null}
				<div class="flex justify-between">
					<span>DC</span>
					<span class="text-text-primary">{snapshot.dc}</span>
				</div>
			{/if}

			<!-- Shift note -->
			{#if snapshot.shifted && snapshot.shiftDirection}
				<div class="text-yellow-400">
					{#if snapshot.shiftDirection === 'up'}
						Nat 20 shifted result up one degree
					{:else}
						Nat 1 shifted result down one degree
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</button>
