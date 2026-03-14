<script lang="ts">
	export type ImportFormat = 'foundry' | 'pathbuilder';

	interface Props {
		selectedFormat: ImportFormat;
	}

	let { selectedFormat = $bindable() }: Props = $props();
</script>

<!-- Format selection pills — user must pick format BEFORE file import -->
<div class="flex gap-2">
	<button
		type="button"
		class="flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors border"
		class:bg-accent={selectedFormat === 'foundry'}
		class:text-white={selectedFormat === 'foundry'}
		class:border-accent={selectedFormat === 'foundry'}
		class:bg-surface-raised={selectedFormat !== 'foundry'}
		class:text-text-muted={selectedFormat !== 'foundry'}
		class:border-surface-raised={selectedFormat !== 'foundry'}
		onclick={() => (selectedFormat = 'foundry')}
	>
		Foundry VTT
	</button>
	<button
		type="button"
		class="flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors border"
		class:bg-accent={selectedFormat === 'pathbuilder'}
		class:text-white={selectedFormat === 'pathbuilder'}
		class:border-accent={selectedFormat === 'pathbuilder'}
		class:bg-surface-raised={selectedFormat !== 'pathbuilder'}
		class:text-text-muted={selectedFormat !== 'pathbuilder'}
		class:border-surface-raised={selectedFormat !== 'pathbuilder'}
		onclick={() => (selectedFormat = 'pathbuilder')}
	>
		Pathbuilder
	</button>
</div>
