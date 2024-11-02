<script lang="ts">
	import { enhance } from '$app/forms';
	import BlockButton from '$lib/components/BlockButton.svelte';
	import Header from '$lib/components/Header.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import ShareForm from '$lib/components/ShareForm.svelte';
	import { APP_NAME } from '$lib/constants';
	import { imageWithUrl } from '$lib/utils';
	import { SvelteSet } from 'svelte/reactivity';
	import type { ActionData, PageServerData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();

	let images = $derived(data.images.map(imageWithUrl));

	$inspect(images);

	let nameInput = $state<HTMLInputElement>() as HTMLInputElement;

	let selectedImagesIds = $state<SvelteSet<string>>(new SvelteSet());

	const onFileChange = (e: Event) => {
		const el = e.target as HTMLFormElement;
		const hasFiles = 'files' in el && el.files.length > 0;
		if (hasFiles) {
			nameInput.value = el.files[0].name;
		}
	};

	const onShareClick = () => {
		dialog.showModal();
	};

	let dialog = $state() as HTMLDialogElement;
</script>

<svelte:head>
	<title>{APP_NAME} / Home</title>
</svelte:head>

<Header username={data.user.username} userId={data.user.id} />

<fieldset class="fat-shadow my-2 border-2 border-black p-2">
	<legend class="ms-4 px-2 font-bold">Upload an image</legend>
	<form
		class="flex flex-col gap-4"
		method="post"
		action="?/uploadImage"
		enctype="multipart/form-data"
		onchange={onFileChange}
		use:enhance
	>
		<label for="name">Name</label>
		<input
			placeholder="Name of your image"
			class="border-2 border-black/50 bg-white"
			type="text"
			name="name"
			id="name"
			bind:this={nameInput}
		/>
		<div class="flex flex-wrap items-center gap-4">
			<label
				for="file"
				class=" fat-shadow block flex-[200px] cursor-pointer border-2 border-black bg-indigo-500 text-center font-bold text-white hover:bg-indigo-700"
			>
				🖼 Choose your image
			</label>

			<input
				class="fat-shadow block flex-[200px] cursor-pointer border-2 px-2"
				type="file"
				name="file"
				id="file"
			/>
		</div>
		<div class="flex flex-wrap items-center gap-4">
			<BlockButton
				type="submit"
				text="Upload"
				classname="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white"
			/>
			<BlockButton
				type="reset"
				text="Clear"
				classname="bg-red-500 hover:bg-red-600 active:bg-red-700  text-white"
			/>
		</div>
		<p title="Click to clear form" class="cursor-pointer text-sm text-red-500 hover:text-red-600">
			{form?.message ?? ' '}
		</p>
	</form>
</fieldset>

<ImageGrid {images} bind:selectedImagesIds>
	{#snippet additionalActions()}
		<button
			class="fat-shadow border-2 border-black bg-blue-500 px-2 font-bold text-white disabled:brightness-50"
			disabled={selectedImagesIds.size == 0}
			onclick={onShareClick}
		>
			🔗 Share selected images ({selectedImagesIds.size})
		</button>
	{/snippet}
</ImageGrid>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dialog} class="w-auto max-w-[800px] bg-transparent">
	<ShareForm imageIds={selectedImagesIds} {form} onclose={() => dialog.close()} />
</dialog>

<style lang="postcss">
	#file::file-selector-button {
		@apply hidden;
	}

	dialog::backdrop {
		@apply bg-black bg-opacity-15 backdrop-blur-md;
	}
</style>
