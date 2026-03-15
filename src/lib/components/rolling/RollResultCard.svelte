<script lang="ts">
	import { rollState } from '$lib/state/roll.svelte';
	import { computeDegree, DEGREE_COLORS } from '$lib/engine';
	import type { ModifierEntry, DegreeOfSuccess } from '$lib/engine';

	// ─── Degree formatting ────────────────────────────────────────────────────

	function formatDegree(degree: string): string {
		return degree.replace(/-/g, ' ').toUpperCase();
	}

	function degreeColor(degree: string): string {
		return DEGREE_COLORS[degree as DegreeOfSuccess] ?? '#888888';
	}

	// ─── Post-roll DC check (what-if) ────────────────────────────────────────

	let postRollDc = $state<number | null>(null);

	const postRollDegree = $derived(() => {
		if (!rollState.snapshot || postRollDc === null || postRollDc <= 0) return null;
		const result = computeDegree(rollState.snapshot.total, postRollDc, rollState.snapshot.naturalDie);
		return result.degree;
	});

	// ─── Modifier breakdown ───────────────────────────────────────────────────

	const keptModifiers = $derived((): ModifierEntry[] => {
		if (!rollState.snapshot?.keptModifiers) return [];
		try {
			return JSON.parse(rollState.snapshot.keptModifiers) as ModifierEntry[];
		} catch {
			return [];
		}
	});

	const groupedModifiers = $derived((): Record<string, ModifierEntry[]> => {
		const groups: Record<string, ModifierEntry[]> = {};
		for (const mod of keptModifiers()) {
			if (!groups[mod.type]) groups[mod.type] = [];
			groups[mod.type].push(mod);
		}
		return groups;
	});

	function formatMod(n: number): string {
		return n >= 0 ? `+${n}` : `${n}`;
	}

	// ─── Toggle expand ────────────────────────────────────────────────────────

	function toggleExpand() {
		rollState.expanded = !rollState.expanded;
	}
</script>

{#if rollState.snapshot !== null}
	{@const snap = rollState.snapshot}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		role="region"
		aria-label="Roll result"
		data-testid="roll-result-card"
		onclick={toggleExpand}
		class="bg-surface-raised border-t border-white/10 px-4 py-3 cursor-pointer select-none"
	>
		<!-- Compact view (always visible) -->
		<div class="flex items-center gap-3 justify-between">
			<div class="flex items-center gap-2 min-w-0">
				<span class="text-text-muted text-xs truncate">{snap.characterName}</span>
				<span class="text-text-primary font-semibold text-sm truncate">{snap.label}</span>
			</div>

			<div class="flex items-center gap-2 shrink-0">
				<!-- Natural d20 -->
				<span class="text-xs text-text-muted">
					nat <span class="font-bold text-text-primary">{snap.naturalDie}</span>
				</span>

				<!-- Total -->
				<span class="text-lg font-bold text-text-primary">{snap.total}</span>

				<!-- DoS badge (from saved degree or post-roll DC check) -->
				{#if snap.degree || postRollDegree()}
					{@const degree = postRollDegree() ?? snap.degree ?? ''}
					{@const color = degreeColor(degree)}
					<span
						data-testid="dos-badge"
						style="background-color: {color}20; color: {color};"
						class="text-xs font-bold px-2 py-0.5 rounded-full"
					>
						{formatDegree(degree)}
					</span>
				{/if}

				<!-- Expand chevron -->
				<svg
					class="w-4 h-4 text-text-muted transition-transform {rollState.expanded ? 'rotate-180' : ''}"
					viewBox="0 0 20 20" fill="currentColor"
				>
					<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
				</svg>
			</div>
		</div>

		<!-- Nat shift note -->
		{#if snap.shifted && snap.shiftDirection}
			<p class="text-xs text-text-muted mt-0.5">
				Shifted {snap.shiftDirection === 'up' ? 'up' : 'down'} (nat {snap.naturalDie})
			</p>
		{/if}

		<!-- Expanded view -->
		{#if rollState.expanded}
			<div data-testid="modifier-breakdown" class="mt-3 pt-3 border-t border-white/10 space-y-2">
				<!-- Notation -->
				<div class="flex justify-between text-xs">
					<span class="text-text-muted">Notation</span>
					<span class="font-mono text-text-primary">{snap.notation}</span>
				</div>

				<!-- Die results -->
				<div class="flex justify-between text-xs">
					<span class="text-text-muted">Die result{snap.dieResults.length > 1 ? 's' : ''}</span>
					<span class="font-mono text-text-primary">[{snap.dieResults.join(', ')}]</span>
				</div>

				<!-- Modifier total -->
				<div class="flex justify-between text-xs">
					<span class="text-text-muted">Modifier</span>
					<span class="font-mono text-text-primary">{formatMod(snap.modifierTotal)}</span>
				</div>

				<!-- Kept modifiers by type -->
				{#if keptModifiers().length > 0}
					<div class="space-y-1">
						<p class="text-xs text-text-muted font-medium">Active modifiers</p>
						{#each Object.entries(groupedModifiers()) as [type, mods]}
							<div class="text-xs text-text-muted">
								<span class="capitalize font-medium">{type}:</span>
								{#each mods as mod}
									<span class="ml-1 text-text-primary">{mod.label} ({formatMod(mod.value)})</span>
								{/each}
							</div>
						{/each}
					</div>
				{/if}

				<!-- DC (if set) -->
				{#if snap.dc !== null}
					<div class="flex justify-between text-xs">
						<span class="text-text-muted">DC</span>
						<span class="text-text-primary">{snap.dc}</span>
					</div>
				{/if}

				<!-- Post-roll DC what-if -->
				<div class="flex items-center gap-2 pt-1">
					<label class="text-xs text-text-muted shrink-0" for="post-roll-dc">Check vs DC</label>
					<input
						id="post-roll-dc"
						type="number"
						bind:value={postRollDc}
						placeholder="Enter DC"
						min="1"
						onclick={(e) => e.stopPropagation()}
						class="flex-1 bg-surface-overlay text-text-primary rounded px-2 py-1 text-xs border border-white/10 focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-text-muted"
					/>
				</div>
			</div>
		{/if}
	</div>
{/if}
