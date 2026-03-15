import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { rollState } from '$lib/state/roll.svelte';
import type { RollSnapshot } from '$lib/db';
import RollResultCard from './RollResultCard.svelte';

const mockSnapshot: RollSnapshot = {
	rolledAt: new Date(),
	characterName: 'Knurvik',
	label: 'Athletics',
	rollType: 'skill',
	notation: '1d20+8',
	dieResults: [15],
	naturalDie: 15,
	modifierTotal: 8,
	total: 23,
	keptModifiers: '[]',
	dc: null,
	degree: null,
	shifted: false,
	shiftDirection: null,
};

const mockSnapshotWithDegree: RollSnapshot = {
	...mockSnapshot,
	dc: 20,
	degree: 'success',
	total: 23,
};

beforeEach(() => {
	rollState.snapshot = null;
	rollState.expanded = false;
});

describe('RollResultCard', () => {
	it('renders nothing when rollState.snapshot is null', async () => {
		rollState.snapshot = null;

		render(RollResultCard);

		const card = document.querySelector('[data-testid="roll-result-card"]');
		expect(card).toBeNull();
	});

	it('in compact view, shows roll label, total, and natural d20', async () => {
		rollState.snapshot = mockSnapshot;

		const { getByText } = render(RollResultCard);

		expect(getByText('Athletics')).toBeDefined();
		expect(getByText('23')).toBeDefined();
		expect(getByText('15')).toBeDefined();
	});

	it('shows colored DoS badge when degree is set', async () => {
		rollState.snapshot = mockSnapshotWithDegree;

		render(RollResultCard);

		const badge = document.querySelector('[data-testid="dos-badge"]');
		expect(badge).toBeDefined();
		expect(badge?.textContent?.toLowerCase()).toContain('success');
	});

	it('clicking card toggles expanded state showing modifier breakdown', async () => {
		rollState.snapshot = mockSnapshot;

		render(RollResultCard);

		const card = document.querySelector('[data-testid="roll-result-card"]');
		expect(card).toBeDefined();

		// Click to expand
		(card as HTMLElement)?.click();

		// Wait for reactivity
		await new Promise(r => setTimeout(r, 50));

		const breakdown = document.querySelector('[data-testid="modifier-breakdown"]');
		expect(breakdown).toBeDefined();
	});
});
