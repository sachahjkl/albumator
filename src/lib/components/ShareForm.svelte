<script lang="ts">
	import { enhance } from '$app/forms';
	import { generateRandomName } from '$lib/utils';
	import { SvelteSet, SvelteURL } from 'svelte/reactivity';

	import { clickOutside } from '$lib/actions.svelte';
	import LoadingDots from '$lib/icons/LoadingDots.svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { Debounced } from 'runed';
	import type { ActionData } from '../../routes/home/$types';
	import Copyable from './Copyable.svelte';

	type ShareFormProps = {
		fresh?: boolean;
		form: ActionData;
		imageIds: SvelteSet<string>;
		visible?: boolean;
		onclose?: () => void;
	};

	const defaultDateHandler = () => {
		const sevenDays = 1000 * 60 * 60 * 24 * 7;
		let exp = new Date(new Date().getTime() + sevenDays);
		exp.setMilliseconds(0);
		exp.setSeconds(0);
		expirationInput.valueAsDate = exp;
	};

	let { form, onclose: onclose, imageIds, fresh = true, visible = true }: ShareFormProps = $props();

	let visibledDelayed = new Debounced(() => visible, 100);

	let nameInput: HTMLInputElement;
	let expirationInput: HTMLInputElement;
	let formEl = $state<HTMLElement>();

	const beforeSubmit = () => {
		fresh = false;
	};

	const beforeClose = () => {
		if (visibledDelayed.current) {
			fresh = true;
			onclose?.call(null);
		}
	};

	let isSharing = $state(false);
	const onSubmit: SubmitFunction = () => {
		isSharing = true;
		return async ({ update }) => {
			isSharing = false;
			await update();
		};
	};
</script>

<form
	use:clickOutside
	onoutclick={beforeClose}
	class="fat-shadow mx-2 block border-2 border-black bg-white p-6"
	method="post"
	action="?/shareImages"
	use:enhance={onSubmit}
	inert={isSharing}
	bind:this={formEl}
>
	<h2 class="mb-4 text-xl font-bold">Share {imageIds.size} image{imageIds.size > 1 ? 's' : ''}</h2>
	<div class="mb-4 flex flex-col gap-4">
		<div class="flex flex-col items-start gap-1">
			<label class="font-bold" for="name">Name</label>
			<input
				class="fat-shadow block w-full border-2 border-black bg-white"
				type="text"
				placeholder="Name of your share"
				name="name"
				id="name"
				bind:this={nameInput}
			/>
			<button
				type="button"
				class="underline"
				onclick={() => (nameInput.value = generateRandomName())}
			>
				Generate random name
			</button>
		</div>
		<!-- date picker for expiration -->
		<div class="flex flex-col items-start gap-1">
			<label class="font-bold" for="expiration">Expiration date (optional)</label>
			<input
				class="fat-shadow block w-full border-2 border-black bg-white"
				type="date"
				name="expiration"
				id="expiration"
				bind:this={expirationInput}
			/>
			<div class="flex flex-row gap-1">
				<button type="button" class="underline" onclick={defaultDateHandler}>
					Expire in 7 days
				</button>
				<p>|</p>
				<button type="button" class="underline" onclick={() => (expirationInput.value = '')}>
					Clear expiration date
				</button>
			</div>
		</div>
		<input type="hidden" name="imageIds" value={JSON.stringify(Array.from(imageIds))} />

		{#if fresh == false}
			{#if form?.shareStatus === 'success'}
				{@const shareHref = new SvelteURL(
					'/shares/' + form?.shareId,
					window.location.href
				).toString()}
				<Copyable value={shareHref}>
					{#snippet copied()}
						✔ Succesfully copied share link to clipboard !
					{/snippet}
					{#snippet pending()}
						🎉 Successfully created share (Click to copy share link)
					{/snippet}
				</Copyable>
			{:else}
				<p
					class:hidden={form?.shareStatus !== 'error'}
					class=" fat-shadow my-2 border-2 border-red-900 bg-red-500 px-2 font-bold text-white"
				>
					Error: {form?.shareMessage ?? ''}
				</p>
			{/if}
		{/if}
	</div>
	<div class="ms-auto flex justify-end gap-2">
		<button
			type="button"
			onclick={beforeClose}
			formmethod="dialog"
			class="fat-shadow border-2 border-black bg-red-500 px-2 font-bold text-white">Close</button
		>
		<button
			onclick={beforeSubmit}
			class="fat-shadow border-2 border-black bg-emerald-500 px-2 font-bold text-white"
		>
			{#if isSharing}
				Sharing <LoadingDots classname="inline-block fill-white" />
			{:else}
				Share
			{/if}
		</button>
	</div>
</form>
