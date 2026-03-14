<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		defaultOpen?: boolean;
		count?: number;
		children: Snippet;
	}

	let { title, defaultOpen = true, count, children }: Props = $props();

	let open = $state(defaultOpen);
</script>

<div class="bg-surface-raised rounded-lg overflow-hidden">
	<!-- Header row -->
	<button
		type="button"
		class="w-full flex items-center justify-between px-4 py-3 text-left"
		onclick={() => (open = !open)}
		aria-expanded={open}
	>
		<div class="flex items-center gap-2">
			<span class="text-text-primary font-semibold text-sm">{title}</span>
			{#if count !== undefined}
				<span class="bg-surface-overlay text-text-muted text-xs px-1.5 py-0.5 rounded-full">
					{count}
				</span>
			{/if}
		</div>
		<!-- Chevron icon -->
		<svg
			class="w-4 h-4 text-text-muted transition-transform duration-200 {open ? 'rotate-180' : ''}"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
			aria-hidden="true"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<!-- Collapsible content -->
	{#if open}
		<div class="px-4 pb-4">
			{@render children()}
		</div>
	{/if}
</div>
