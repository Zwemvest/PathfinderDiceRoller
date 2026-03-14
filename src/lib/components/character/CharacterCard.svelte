<script lang="ts">
	import type { StoredCharacter } from '$lib/db/index';

	interface Props {
		character: StoredCharacter;
		isActive: boolean;
		onSelect: () => void;
		onDelete: () => void;
	}

	let { character, isActive, onSelect, onDelete }: Props = $props();
</script>

<div
	class="relative rounded-xl border-2 p-4 transition-colors cursor-pointer"
	class:border-accent={isActive}
	class:bg-accent-muted={isActive}
	class:border-surface-raised={!isActive}
	class:bg-surface-raised={!isActive}
	role="button"
	tabindex="0"
	onclick={onSelect}
	onkeydown={(e) => e.key === 'Enter' && onSelect()}
>
	<!-- Active indicator -->
	{#if isActive}
		<span
			class="absolute top-2 left-2 text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full"
		>
			Active
		</span>
	{/if}

	<!-- Delete button (top right corner) -->
	<button
		type="button"
		class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors text-xs"
		aria-label="Delete {character.name}"
		onclick={(e) => {
			e.stopPropagation();
			onDelete();
		}}
	>
		✕
	</button>

	<!-- Character info -->
	<div class="mt-4">
		<p class="font-semibold text-text-primary text-base leading-tight">{character.name}</p>
		<p class="text-sm text-text-muted mt-0.5">
			Level {character.level} {character.class}
		</p>
		<p class="text-xs text-text-muted mt-1">
			{character.ancestry}{character.heritage ? ` · ${character.heritage}` : ''}
		</p>
	</div>
</div>
