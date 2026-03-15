<script lang="ts">
	import { dialogState, closePreRollDialog, setLastRoll } from '$lib/state/roll.svelte';
	import {
		PRESET_MODIFIERS,
		resolveModifiers,
		rollExpression,
		computeDegree,
		type ModifierEntry,
	} from '$lib/engine';
	import { saveRoll } from '$lib/db/roll-helpers';
	import type { NormalizedSkill } from '$lib/parsers/types';

	interface Props {
		availableSkills?: NormalizedSkill[];
	}

	let { availableSkills = [] }: Props = $props();

	// ─── Local state ─────────────────────────────────────────────────────────

	let dialogEl = $state<HTMLDialogElement | null>(null);
	let dcInput = $state<number | null>(null);
	let isRolling = $state(false);

	// Clone PRESET_MODIFIERS into local mutable state for toggling
	let localModifiers = $state<ModifierEntry[]>(
		PRESET_MODIFIERS.map(m => ({ ...m }))
	);

	// For initiative: which skill is selected (default: 'perception')
	let selectedInitiativeSkill = $state<string>('perception');

	// ─── Effect: sync dialog open/close ──────────────────────────────────────

	$effect(() => {
		if (!dialogEl) return;
		if (dialogState.open) {
			// Reset modifier toggles and DC when opening
			localModifiers = PRESET_MODIFIERS.map(m => ({ ...m }));
			dcInput = null;
			selectedInitiativeSkill = 'perception';
			try {
				dialogEl.showModal();
			} catch {
				// Already open
			}
		} else {
			try {
				dialogEl.close();
			} catch {
				// Already closed
			}
		}
	});

	// ─── Computed: effective modifier (for initiative, may change based on selection) ──

	const effectiveLabel = $derived(
		dialogState.rollType === 'initiative' && selectedInitiativeSkill !== 'perception'
			? `Initiative (${getSelectedSkillLabel()})`
			: dialogState.label
	);

	const effectiveModifier = $derived(
		dialogState.rollType === 'initiative' && selectedInitiativeSkill !== 'perception'
			? getSelectedSkillTotal()
			: dialogState.baseModifier
	);

	function getSelectedSkillLabel(): string {
		const skill = availableSkills.find(s => s.slug === selectedInitiativeSkill);
		return skill?.label ?? selectedInitiativeSkill;
	}

	function getSelectedSkillTotal(): number {
		const skill = availableSkills.find(s => s.slug === selectedInitiativeSkill);
		return skill?.total ?? dialogState.baseModifier;
	}

	function formatMod(n: number): string {
		return n >= 0 ? `+${n}` : `${n}`;
	}

	// ─── Toggle modifier chip ─────────────────────────────────────────────────

	function toggleModifier(index: number) {
		localModifiers[index] = { ...localModifiers[index], enabled: !localModifiers[index].enabled };
	}

	// ─── Roll handler ─────────────────────────────────────────────────────────

	async function handleRoll() {
		if (isRolling) return;
		isRolling = true;

		try {
			const activatedMods = localModifiers.filter(m => m.enabled);
			const resolved = resolveModifiers(activatedMods);
			const modSum = effectiveModifier + resolved.total;

			let notation: string;
			if (dialogState.rollType === 'free-form') {
				// Free-form: use label as the notation directly
				notation = dialogState.label;
			} else {
				// Check: 1d20 + combined modifier
				if (modSum >= 0) {
					notation = `1d20+${modSum}`;
				} else {
					notation = `1d20${modSum}`; // e.g. 1d20-3
				}
			}

			const roll = rollExpression(notation);
			const dc = dcInput !== null && dcInput > 0 ? dcInput : null;

			// Only compute degree for d20-based rolls
			const isD20Roll = dialogState.rollType !== 'free-form';
			let degree: string | null = null;
			let shifted = false;
			let shiftDirection: string | null = null;

			if (isD20Roll && dc !== null) {
				const degResult = computeDegree(roll.total, dc, roll.naturalDie);
				degree = degResult.degree;
				shifted = degResult.shifted;
				shiftDirection = degResult.shiftDirection ?? null;
			}

			const snapshot = {
				rolledAt: new Date(),
				characterName: dialogState.characterName,
				label: effectiveLabel,
				rollType: dialogState.rollType,
				notation: roll.notation,
				dieResults: roll.dieResults,
				naturalDie: roll.naturalDie,
				modifierTotal: resolved.total,
				total: roll.total,
				keptModifiers: JSON.stringify(resolved.kept),
				dc,
				degree,
				shifted,
				shiftDirection,
			};

			await saveRoll(snapshot);
			setLastRoll(snapshot);
			closePreRollDialog();
		} finally {
			isRolling = false;
		}
	}

	// ─── Close on dialog cancel (Escape key) ─────────────────────────────────

	function handleClose() {
		closePreRollDialog();
	}
</script>

<!-- Native <dialog> modal -->
<dialog
	bind:this={dialogEl}
	onclose={handleClose}
	class="bg-surface-raised text-text-primary rounded-xl shadow-2xl p-0 max-w-sm w-full mx-4 backdrop:bg-black/60"
>
	{#if dialogState.open}
		<div class="p-5 space-y-4">
			<!-- Header: label + base modifier -->
			<div class="flex items-baseline justify-between gap-2">
				<h2 class="text-xl font-bold text-text-primary">{effectiveLabel}</h2>
				<span class="text-2xl font-bold text-accent">{formatMod(effectiveModifier)}</span>
			</div>

			<!-- Initiative skill picker -->
			{#if dialogState.rollType === 'initiative'}
				<div class="space-y-1">
					<label class="text-xs text-text-muted font-medium" for="initiative-skill-select">Roll Initiative with</label>
					<select
						id="initiative-skill-select"
						data-testid="initiative-skill-select"
						bind:value={selectedInitiativeSkill}
						class="w-full bg-surface-overlay text-text-primary rounded-lg px-3 py-2 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-accent"
					>
						<option value="perception">Perception ({formatMod(dialogState.baseModifier)})</option>
						{#each availableSkills as skill}
							<option value={skill.slug}>{skill.label} ({formatMod(skill.total)})</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- Modifier chips -->
			<div class="space-y-1.5">
				<p class="text-xs text-text-muted font-medium">Modifiers</p>
				<div class="flex flex-wrap gap-2">
					{#each localModifiers as modifier, i}
						<button
							type="button"
							data-testid="modifier-chip"
							onclick={() => toggleModifier(i)}
							class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors {modifier.enabled
								? 'bg-accent text-white'
								: 'bg-surface-overlay text-text-muted hover:bg-surface-overlay/80'}"
						>
							{modifier.label}
							<span class="ml-1 opacity-75">{modifier.value >= 0 ? '+' : ''}{modifier.value}</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- DC entry -->
			<div class="space-y-1">
				<label class="text-xs text-text-muted font-medium" for="dc-input">DC (optional)</label>
				<input
					id="dc-input"
					data-testid="dc-input"
					type="number"
					bind:value={dcInput}
					placeholder="—"
					min="1"
					max="999"
					class="w-full bg-surface-overlay text-text-primary rounded-lg px-3 py-2 text-sm border border-white/10 focus:outline-none focus:ring-2 focus:ring-accent placeholder:text-text-muted"
				/>
			</div>

			<!-- Actions -->
			<div class="flex gap-2 pt-1">
				<button
					type="button"
					onclick={() => closePreRollDialog()}
					class="flex-1 py-2.5 rounded-lg bg-surface-overlay text-text-muted text-sm font-medium hover:bg-surface-overlay/80 transition-colors"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleRoll}
					disabled={isRolling}
					class="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
				>
					{isRolling ? 'Rolling…' : 'Roll'}
				</button>
			</div>
		</div>
	{/if}
</dialog>
