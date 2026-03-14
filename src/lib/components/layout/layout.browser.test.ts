import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TabBar from './TabBar.svelte';

describe('TabBar', () => {
	it('renders 3 tab links', async () => {
		render(TabBar);

		const links = document.querySelectorAll('nav a');
		expect(links.length).toBe(3);
	});

	it('tab links have correct labels', async () => {
		const { getByText } = render(TabBar);

		expect(getByText('Character')).toBeDefined();
		expect(getByText('Roll')).toBeDefined();
		expect(getByText('History')).toBeDefined();
	});

	it('active tab gets aria-current=page attribute for /character pathname', async () => {
		// The stub sets pathname to '/character'
		render(TabBar);

		const characterLink = document.querySelector('nav a[aria-current="page"]');
		expect(characterLink).toBeDefined();
		expect(characterLink?.textContent).toContain('Character');
	});
});

describe('Layout responsive check', () => {
	it('does not produce horizontal overflow at 375px viewport width', async () => {
		// Render the widest bottom chrome component
		render(TabBar);

		// scrollWidth should not exceed clientWidth — no horizontal scroll
		const scrollWidth = document.documentElement.scrollWidth;
		const clientWidth = document.documentElement.clientWidth;
		expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
	});
});
