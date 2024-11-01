<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { on } from 'svelte/events';
	import type { ActionData } from '../../routes/$types';

	type ShareDialogProps = {
		form: ActionData;
		show: 'open' | 'closed';
	};

	let onclose = () => {
		show = 'closed';
	};

	onMount(() => {
		return on(dialog, 'close', onclose);
	});

	$effect(() => {
		if (show === 'open') {
			// nameInput.value = generateRandomName();
		}
	});

	$effect(() => {
		if (show === 'open') {
			dialog.showModal();
			document.body.style.overflow = 'hidden';
		}
		if (show === 'closed') {
			dialog.close();
			document.body.style.overflow = '';
		}
	});

	let { form, show = $bindable('closed') }: ShareDialogProps = $props();
	let dialog: HTMLDialogElement;
	let nameInput: HTMLInputElement;
</script>

<dialog bind:this={dialog} class="w-auto max-w-[800px]">
	<form
		class="fat-shadow z-50 block border-2 border-black bg-white p-6"
		method="post"
		action="?/shareImages"
		use:enhance
	>
		<div class="mb-4 flex flex-col gap-4">
			<label for="name">Name</label>
			<input
				type="text"
				placeholder="Name of your share"
				name="name"
				id="name"
				bind:this={nameInput}
			/>
			<!-- date picker for expiration -->
			<label for="expiration">Expiration date (optional)</label>
			<input type="date" name="expiration" id="expiration" />

			{#if form?.shareDialog?.success === true}
				<a
					class="font-fat-shadow my-2 border-2 border-green-900 bg-green-500 px-2 font-bold text-white underline"
					target="_blank"
					href="/shares/{form?.shareDialog?.shareId}"
					>Share created successfully (Click to view)
				</a>
			{:else}
				<p
					class:hidden={form?.shareDialog?.message === undefined}
					class=" fat-shadow my-2 border-2 border-red-900 bg-red-500 px-2 font-bold text-white"
				>
					{form?.shareDialog?.message ?? ''}
				</p>
			{/if}
		</div>
		<div class="ms-auto flex justify-end gap-2">
			<button
				value="cancel"
				formmethod="dialog"
				class="fat-shadow border-2 border-black bg-red-500 px-2 font-bold text-white">Cancel</button
			>
			<button class="fat-shadow border-2 border-black bg-emerald-500 px-2 font-bold text-white"
				>Share</button
			>
		</div>
	</form>
</dialog>

<style lang="postcss">
	dialog::backdrop {
		@apply bg-black bg-opacity-15 backdrop-blur-md;
	}
</style>
