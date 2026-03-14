<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	onMount(() => {
		if (browser) {
			goto(`${base}/character`, { replaceState: true });
		}
	});
</script>

<!-- Brief loading state while redirect happens -->
<div class="flex items-center justify-center h-full">
	<p class="text-text-muted text-sm">Loading...</p>
</div>
