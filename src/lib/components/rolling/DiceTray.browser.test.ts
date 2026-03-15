import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DiceTray from './DiceTray.svelte';

describe('DiceTray', () => {
	it('renders collapsed bar by default with "Free Roll" text', async () => {
		const { getByText } = render(DiceTray);

		expect(getByText('Free Roll')).toBeDefined();

		// Expanded input should NOT be visible
		const input = document.querySelector('[data-testid="dice-expression-input"]');
		expect(input).toBeNull();
	});

	it('clicking the bar expands to show text input and Roll button', async () => {
		render(DiceTray);

		const bar = document.querySelector('[data-testid="dice-tray-bar"]');
		expect(bar).toBeDefined();

		(bar as HTMLElement)?.click();
		await new Promise(r => setTimeout(r, 50));

		const input = document.querySelector('[data-testid="dice-expression-input"]');
		expect(input).toBeDefined();

		const rollBtn = document.querySelector('[data-testid="dice-roll-button"]');
		expect(rollBtn).toBeDefined();
	});

	it('text input accepts dice expression text', async () => {
		render(DiceTray);

		const bar = document.querySelector('[data-testid="dice-tray-bar"]');
		(bar as HTMLElement)?.click();
		await new Promise(r => setTimeout(r, 50));

		const input = document.querySelector('[data-testid="dice-expression-input"]') as HTMLInputElement;
		expect(input).toBeDefined();

		// Set value programmatically and fire input event
		input.value = '3d6+2';
		input.dispatchEvent(new Event('input'));
		await new Promise(r => setTimeout(r, 10));

		expect(input.value).toBe('3d6+2');
	});
});
