<script lang="ts">
	import '../app.css';
	import { pwaInfo } from 'virtual:pwa-info';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import TabBar from '$lib/components/layout/TabBar.svelte';
	import DiceTray from '$lib/components/layout/DiceTray.svelte';
	import RollResultCard from '$lib/components/layout/RollResultCard.svelte';
	import { requestPersistentStorage } from '$lib/db/persistence';

	let { children } = $props();

	const webManifestLink = $derived(pwaInfo ? pwaInfo.webManifest.linkTag : '');

	onMount(async () => {
		if (browser) {
			await requestPersistentStorage();
		}
	});
</script>

<svelte:head>
	{@html webManifestLink}
</svelte:head>

<!-- Full-height flex column: scrollable content + fixed bottom chrome -->
<div class="flex flex-col h-dvh overflow-hidden bg-surface-base text-text-primary">
	<!-- Scrollable page content -->
	<main class="flex-1 overflow-y-auto">
		{@render children()}
	</main>

	<!-- Persistent roll result (above dice tray) -->
	<RollResultCard />

	<!-- Sticky dice tray -->
	<DiceTray />

	<!-- Bottom tabs -->
	<TabBar />
</div>
