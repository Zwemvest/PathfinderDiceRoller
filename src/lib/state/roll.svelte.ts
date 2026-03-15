import type { RollSnapshot } from '$lib/db';

// ─── Roll result state ─────────────────────────────────────────────────────────

/**
 * Module-level reactive state for the last roll result and whether the
 * result panel is expanded. Shared across all components that display or
 * trigger rolls.
 *
 * Mutate properties directly — never reassign the whole object (Svelte 5
 * $state proxy rules).
 */
export const rollState = $state<{
	snapshot: RollSnapshot | null;
	expanded: boolean;
}>({ snapshot: null, expanded: false });

// ─── Pre-roll dialog state ─────────────────────────────────────────────────────

/**
 * Module-level reactive state for the pre-roll modifier/DC dialog.
 */
export const dialogState = $state<{
	open: boolean;
	label: string;
	baseModifier: number;
	rollType: 'skill' | 'save' | 'perception' | 'initiative' | 'free-form';
	skillSlug?: string;
	characterName: string;
}>({ open: false, label: '', baseModifier: 0, rollType: 'skill', characterName: '' });

// ─── Actions ───────────────────────────────────────────────────────────────────

/**
 * Open the pre-roll dialog with the given parameters.
 * Always mutates dialog properties directly to stay compatible with
 * Svelte 5 $state proxies.
 */
export function openPreRollDialog(
	label: string,
	baseModifier: number,
	rollType: 'skill' | 'save' | 'perception' | 'initiative' | 'free-form',
	characterName: string,
	skillSlug?: string
): void {
	dialogState.label = label;
	dialogState.baseModifier = baseModifier;
	dialogState.rollType = rollType;
	dialogState.characterName = characterName;
	dialogState.skillSlug = skillSlug;
	dialogState.open = true;
}

/**
 * Close the pre-roll dialog.
 */
export function closePreRollDialog(): void {
	dialogState.open = false;
}

/**
 * Record the most recent roll result and collapse the result panel.
 */
export function setLastRoll(snapshot: RollSnapshot): void {
	rollState.snapshot = snapshot;
	rollState.expanded = false;
}
