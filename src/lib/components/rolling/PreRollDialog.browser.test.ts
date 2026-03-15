import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { dialogState } from '$lib/state/roll.svelte';
import type { NormalizedSkill } from '$lib/parsers/types';
import PreRollDialog from './PreRollDialog.svelte';

const mockSkills: NormalizedSkill[] = [
	{ slug: 'athletics', label: 'Athletics', ability: 'str', total: 8, proficiencyRank: 2, itemBonus: 0 },
	{ slug: 'stealth', label: 'Stealth', ability: 'dex', total: 12, proficiencyRank: 3, itemBonus: 0 },
];

beforeEach(() => {
	dialogState.open = false;
	dialogState.label = '';
	dialogState.baseModifier = 0;
	dialogState.rollType = 'skill';
	dialogState.characterName = '';
	dialogState.skillSlug = undefined;
});

describe('PreRollDialog', () => {
	it('renders dialog with roll label and base modifier when dialogState.open is true', async () => {
		dialogState.open = true;
		dialogState.label = 'Athletics';
		dialogState.baseModifier = 8;
		dialogState.rollType = 'skill';
		dialogState.characterName = 'Knurvik';

		const { getByText } = render(PreRollDialog);

		expect(getByText('Athletics')).toBeDefined();
		expect(getByText('+8')).toBeDefined();
	});

	it('renders all 9 PRESET_MODIFIERS as toggleable chip buttons', async () => {
		dialogState.open = true;
		dialogState.label = 'Fortitude';
		dialogState.baseModifier = 5;
		dialogState.rollType = 'save';
		dialogState.characterName = 'Knurvik';

		render(PreRollDialog);

		const chips = document.querySelectorAll('[data-testid="modifier-chip"]');
		expect(chips.length).toBe(9);
	});

	it('renders DC number input field', async () => {
		dialogState.open = true;
		dialogState.label = 'Athletics';
		dialogState.baseModifier = 8;
		dialogState.rollType = 'skill';
		dialogState.characterName = 'Knurvik';

		render(PreRollDialog);

		const dcInput = document.querySelector('[data-testid="dc-input"]');
		expect(dcInput).toBeDefined();
	});

	it('renders Roll button', async () => {
		dialogState.open = true;
		dialogState.label = 'Athletics';
		dialogState.baseModifier = 8;
		dialogState.rollType = 'skill';
		dialogState.characterName = 'Knurvik';

		const { getByText } = render(PreRollDialog);

		expect(getByText('Roll')).toBeDefined();
	});

	it('renders skill picker select dropdown when rollType is initiative', async () => {
		dialogState.open = true;
		dialogState.label = 'Initiative';
		dialogState.baseModifier = 5;
		dialogState.rollType = 'initiative';
		dialogState.characterName = 'Knurvik';

		render(PreRollDialog, { props: { availableSkills: mockSkills } });

		const select = document.querySelector('[data-testid="initiative-skill-select"]');
		expect(select).toBeDefined();
	});
});
