<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import FormatPicker, { type ImportFormat } from './FormatPicker.svelte';
	import { parseFoundry } from '$lib/parsers/foundry';
	import { parsePathbuilder } from '$lib/parsers/pathbuilder';
	import { ImportError, type NormalizedCharacter } from '$lib/parsers/types';
	import {
		saveCharacter,
		findCharacterByName,
		setActiveCharacterId,
		type StoredCharacter
	} from '$lib/db/index';

	// ─── State ────────────────────────────────────────────────────────────────

	type ImportState =
		| { kind: 'idle' }
		| { kind: 'parsing' }
		| { kind: 'success'; character: StoredCharacter }
		| { kind: 'error'; message: string }
		| { kind: 'confirm-reimport'; existing: StoredCharacter; incoming: NormalizedCharacter; changes: string[] };

	let state = $state<ImportState>({ kind: 'idle' });
	let selectedFormat = $state<ImportFormat>('foundry');
	let isDragOver = $state(false);
	let fileInput: HTMLInputElement;

	// ─── File handling ────────────────────────────────────────────────────────

	async function handleFile(file: File): Promise<void> {
		if (!file.name.endsWith('.json')) {
			state = { kind: 'error', message: 'Please select a .json file.' };
			return;
		}

		state = { kind: 'parsing' };

		let text: string;
		try {
			text = await file.text();
		} catch {
			state = { kind: 'error', message: 'Failed to read file.' };
			return;
		}

		let json: unknown;
		try {
			json = JSON.parse(text);
		} catch {
			state = { kind: 'error', message: 'Invalid JSON file — could not parse.' };
			return;
		}

		let parsed: NormalizedCharacter;
		try {
			parsed =
				selectedFormat === 'foundry' ? parseFoundry(json) : parsePathbuilder(json);
		} catch (err) {
			if (err instanceof ImportError) {
				const fieldHint = err.missingField
					? ` Missing field: ${err.missingField}`
					: '';
				state = {
					kind: 'error',
					message: `Found JSON but missing expected fields.${fieldHint}`
				};
			} else {
				state = {
					kind: 'error',
					message: err instanceof Error ? err.message : 'Unknown parse error.'
				};
			}
			return;
		}

		// Check for existing character by name (re-import)
		const existing = await findCharacterByName(parsed.name);
		if (existing) {
			const changes = diffCharacter(existing, parsed);
			state = {
				kind: 'confirm-reimport',
				existing,
				incoming: parsed,
				changes
			};
			return;
		}

		// New character — save and activate
		await persistAndActivate(parsed);
	}

	async function persistAndActivate(char: NormalizedCharacter, existingId?: number): Promise<void> {
		const toSave: StoredCharacter = existingId !== undefined ? { ...char, id: existingId } : char;
		const id = await saveCharacter(toSave);
		await setActiveCharacterId(id);
		const saved = { ...toSave, id };
		state = { kind: 'success', character: saved };
	}

	// ─── Re-import diff ───────────────────────────────────────────────────────

	function diffCharacter(old: NormalizedCharacter, incoming: NormalizedCharacter): string[] {
		const changes: string[] = [];

		if (old.level !== incoming.level) {
			changes.push(`Level: ${old.level} → ${incoming.level}`);
		}
		if (old.class !== incoming.class) {
			changes.push(`Class: ${old.class} → ${incoming.class}`);
		}
		if (old.feats.length !== incoming.feats.length) {
			changes.push(`Feats: ${old.feats.length} → ${incoming.feats.length}`);
		}
		if (old.skills.length !== incoming.skills.length) {
			changes.push(`Skills: ${old.skills.length} → ${incoming.skills.length}`);
		}
		if (old.weapons.length !== incoming.weapons.length) {
			changes.push(`Weapons: ${old.weapons.length} → ${incoming.weapons.length}`);
		}
		if (old.maxHp !== incoming.maxHp) {
			changes.push(`Max HP: ${old.maxHp} → ${incoming.maxHp}`);
		}

		return changes.length > 0 ? changes : ['No tracked changes detected'];
	}

	// ─── Event handlers ───────────────────────────────────────────────────────

	function onFileInputChange(e: Event): void {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) handleFile(file);
		// Reset so same file can be re-imported
		input.value = '';
	}

	function onDragOver(e: DragEvent): void {
		e.preventDefault();
		isDragOver = true;
	}

	function onDragLeave(): void {
		isDragOver = false;
	}

	function onDrop(e: DragEvent): void {
		e.preventDefault();
		isDragOver = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) handleFile(file);
	}

	async function confirmReimport(): Promise<void> {
		if (state.kind !== 'confirm-reimport') return;
		await persistAndActivate(state.incoming, state.existing.id);
	}

	function cancelReimport(): void {
		state = { kind: 'idle' };
	}

	function reset(): void {
		state = { kind: 'idle' };
	}

	function goToCharacter(): void {
		goto(`${base}/character`);
	}
</script>

<div class="flex flex-col gap-4 p-4 max-w-sm mx-auto w-full">

	<!-- Format picker — shown in all non-terminal states -->
	{#if state.kind === 'idle' || state.kind === 'error'}
		<div class="flex flex-col gap-3">
			<p class="text-sm text-text-muted text-center">Select your character format</p>
			<FormatPicker bind:selectedFormat />
		</div>

		<!-- Drop zone + file picker -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed transition-colors min-h-32"
			class:border-accent={isDragOver}
			class:bg-accent-muted={isDragOver}
			class:border-surface-raised={!isDragOver}
			ondragover={onDragOver}
			ondragleave={onDragLeave}
			ondrop={onDrop}
		>
			<span class="text-3xl" aria-hidden="true">📂</span>
			<p class="text-sm text-text-muted text-center">Drop your JSON file here, or</p>
			<button
				type="button"
				class="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium"
				onclick={() => fileInput.click()}
			>
				Choose File
			</button>
		</div>

		{#if state.kind === 'error'}
			<div class="rounded-lg border border-red-500 bg-red-500/10 p-3">
				<p class="text-sm text-red-400">{state.message}</p>
			</div>
		{/if}

		<!-- Hidden file input -->
		<input
			bind:this={fileInput}
			type="file"
			accept=".json"
			class="hidden"
			onchange={onFileInputChange}
		/>
	{/if}

	<!-- Parsing spinner -->
	{#if state.kind === 'parsing'}
		<div class="flex flex-col items-center gap-3 py-8">
			<div class="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
			<p class="text-sm text-text-muted">Parsing character...</p>
		</div>
	{/if}

	<!-- Success confirmation -->
	{#if state.kind === 'success'}
		<div class="rounded-xl border-2 border-accent bg-accent/10 p-4 flex flex-col gap-3">
			<div class="flex items-center gap-2">
				<span class="text-2xl" aria-hidden="true">✅</span>
				<div>
					<p class="font-semibold text-text-primary">
						Imported {state.character.name}
					</p>
					<p class="text-sm text-text-muted">
						Level {state.character.level} {state.character.class}
					</p>
				</div>
			</div>
			<button
				type="button"
				class="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium"
				onclick={goToCharacter}
			>
				View Character
			</button>
			<button
				type="button"
				class="px-4 py-2 rounded-lg bg-surface-raised text-text-muted text-sm"
				onclick={reset}
			>
				Import Another
			</button>
		</div>
	{/if}

	<!-- Re-import confirmation -->
	{#if state.kind === 'confirm-reimport'}
		<div class="rounded-xl border-2 border-yellow-500 bg-yellow-500/10 p-4 flex flex-col gap-3">
			<div class="flex items-center gap-2">
				<span class="text-2xl" aria-hidden="true">🔄</span>
				<div>
					<p class="font-semibold text-text-primary">Re-import {state.incoming.name}?</p>
					<p class="text-sm text-text-muted">This character already exists.</p>
				</div>
			</div>

			{#if state.changes.length > 0}
				<div class="rounded-lg bg-surface-raised p-3">
					<p class="text-xs font-medium text-text-muted mb-1">Changes detected:</p>
					<ul class="text-sm text-text-primary space-y-0.5">
						{#each state.changes as change}
							<li>• {change}</li>
						{/each}
					</ul>
				</div>
			{/if}

			<div class="flex gap-2">
				<button
					type="button"
					class="flex-1 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium"
					onclick={confirmReimport}
				>
					Replace
				</button>
				<button
					type="button"
					class="flex-1 px-4 py-2 rounded-lg bg-surface-raised text-text-muted text-sm"
					onclick={cancelReimport}
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}

</div>
