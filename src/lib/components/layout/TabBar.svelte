<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';

	const tabs = [
		{ label: 'Character', href: `${base}/character`, icon: '🛡️' },
		{ label: 'Roll', href: `${base}/roll`, icon: '🎲' },
		{ label: 'History', href: `${base}/history`, icon: '📜' }
	];
</script>

<nav
	class="flex border-t border-surface-raised bg-surface-base"
	style="padding-bottom: env(safe-area-inset-bottom)"
>
	{#each tabs as tab}
		<a
			href={tab.href}
			class="flex flex-1 flex-col items-center justify-center py-2 min-h-[var(--tap-target-min)] text-text-muted aria-[current=page]:text-accent transition-colors"
			aria-current={page.url.pathname.startsWith(tab.href) ? 'page' : undefined}
		>
			<span class="text-xl" aria-hidden="true">{tab.icon}</span>
			<span class="text-xs mt-0.5">{tab.label}</span>
		</a>
	{/each}
</nav>
