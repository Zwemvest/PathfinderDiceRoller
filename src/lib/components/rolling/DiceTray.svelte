<script lang="ts">
	import { openPreRollDialog } from '$lib/state/roll.svelte';
	import { rollExpression, type DiceRollResult } from '$lib/engine';
	import { saveRoll } from '$lib/db/roll-helpers';
	import { setLastRoll } from '$lib/state/roll.svelte';

	// ─── Local state ─────────────────────────────────────────────────────────

	let expanded = $state(false);
	let expression = $state('');
	let isRolling = $state(false);
	let errorMsg = $state('');

	// ─── Toggle expanded/collapsed ────────────────────────────────────────────

	function toggleExpand() {
		expanded = !expanded;
		if (expanded) {
			errorMsg = '';
		}
	}

	// ─── Direct roll (no modifier toggles) ───────────────────────────────────

	async function handleRoll() {
		if (!expression.trim() || isRolling) return;
		isRolling = true;
		errorMsg = '';

		try {
			let roll: DiceRollResult;
			try {
				roll = rollExpression(expression.trim());
			} catch {
				errorMsg = 'Invalid dice expression';
				isRolling = false;
				return;
			}

			const snapshot = {
				rolledAt: new Date(),
				characterName: 'Free-form',
				label: expression.trim(),
				rollType: 'free-form' as const,
				notation: roll.notation,
				dieResults: roll.dieResults,
				naturalDie: roll.naturalDie,
				modifierTotal: 0,
				total: roll.total,
				keptModifiers: '[]',
				dc: null,
				degree: null,
				shifted: false,
				shiftDirection: null,
			};

			await saveRoll(snapshot);
			setLastRoll(snapshot);
			expression = '';
			expanded = false;
		} finally {
			isRolling = false;
		}
	}

	// ─── Open pre-roll dialog for modifier toggles ────────────────────────────

	function handleOpenDialog() {
		if (!expression.trim()) return;
		openPreRollDialog(expression.trim(), 0, 'free-form', 'Free-form');
		expanded = false;
	}
</script>

<div class="bg-surface-raised border-t border-white/10">
	<!-- Collapsed bar / header -->
	<button
		type="button"
		data-testid="dice-tray-bar"
		onclick={toggleExpand}
		class="w-full flex items-center justify-between px-4 py-2.5 text-text-muted hover:text-text-primary transition-colors"
	>
		<div class="flex items-center gap-2">
			<!-- Dice icon -->
			<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
				<path d="M5 3a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h14v14H5V5zm3 2a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2zm-4 3a1 1 0 100 2 1 1 0 000-2zm-4 4a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z"/>
			</svg>
			<span class="text-sm font-medium">Free Roll</span>
		</div>
		<svg
			class="w-4 h-4 transition-transform {expanded ? 'rotate-180' : ''}"
			viewBox="0 0 20 20" fill="currentColor"
		>
			<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
		</svg>
	</button>

	<!-- Expanded content -->
	{#if expanded}
		<div class="px-4 pb-3 space-y-2">
			<!-- Expression input -->
			<div class="flex gap-2">
				<input
					type="text"
					data-testid="dice-expression-input"
					bind:value={expression}
					placeholder="e.g. 3d6+2, 4d6kh3, 2d8"
					class="flex-1 bg-surface-overlay text-text-primary rounded-lg px-3 py-2 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-text-muted"
					onkeydown={(e) => { if (e.key === 'Enter') handleRoll(); }}
				/>
				<button
					type="button"
					data-testid="dice-roll-button"
					onclick={handleRoll}
					disabled={!expression.trim() || isRolling}
					class="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
				>
					{isRolling ? '…' : 'Roll'}
				</button>
			</div>

			<!-- Modifier toggle button -->
			<button
				type="button"
				onclick={handleOpenDialog}
				disabled={!expression.trim()}
				class="text-xs text-accent hover:underline disabled:opacity-40 disabled:no-underline"
			>
				Add modifier toggles & DC
			</button>

			<!-- Error message -->
			{#if errorMsg}
				<p class="text-xs text-red-400">{errorMsg}</p>
			{/if}
		</div>
	{/if}
</div>
