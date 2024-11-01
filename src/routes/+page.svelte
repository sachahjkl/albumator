<script lang="ts">
	import { enhance } from '$app/forms';
	import Header from '$lib/components/Header.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import ShareDialog from '$lib/components/ShareDialog.svelte';
	import { APP_NAME } from '$lib/constants';
	import type { LightImage } from '$lib/server/db/queries';
	import { SvelteSet } from 'svelte/reactivity';
	import type { ActionData, PageServerData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();

	let nameInput = $state<HTMLInputElement>() as HTMLInputElement;

	let filterValue = $state('');

	let imageSize = $state(250);
	let lightboxState = $state<'open' | 'closed'>('closed');
	let lastClickedImageId = $state('');
	let selectedImagesIds = $state<SvelteSet<string>>(new SvelteSet());
	let selectMode = $state(false);

	let shareDialogState = $state<'open' | 'closed'>('closed');

	let filteredImages = $state<LightImage[]>([]);

	$effect(() => {
		const filter = textFilter(filterValue);
		data.images.then((images) => {
			filteredImages = images.filter(filter);
		});
	});

	const onimageclick = (imageId: string) => {
		lastClickedImageId = imageId;
		lightboxState = 'open';
	};

	const textFilter = (filter: string) => {
		return (value: { name: string }) => value.name.toLowerCase().includes(filter);
	};

	const smallImageConverter = (image: LightImage) => {
		return {
			id: image.id,
			name: image.name,
			url: `/images/${image.id}`
		};
	};

	const onFileChange = (e: Event) => {
		const el = e.target as HTMLFormElement;
		if (el.files.length == 0) {
			return;
		}
		nameInput.value = el.files[0].name;
	};
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
			class="border-2 border-black/50 bg-white py-1"
			type="text"
			name="name"
			id="name"
			bind:this={nameInput}
		/>
		<div class="flex flex-wrap items-center gap-4">
			<label
				for="file"
				class=" fat-shadow block flex-[200px] cursor-pointer border-2 border-black bg-indigo-500 px-2 py-1 text-center font-bold text-white hover:bg-indigo-700"
			>
				🖼 Choose your image
			</label>

			<input
				class="fat-shadow block flex-[200px] cursor-pointer border-2 px-2 py-1"
				type="file"
				name="file"
				id="file"
			/>
		</div>
		<div class="flex flex-wrap items-center gap-4">
			<button
				class="fat-shadow flex-[200px] border-2 border-black bg-green-700 px-2 font-bold text-white hover:bg-green-900"
				type="submit">Upload</button
			>
			<button
				class="fat-shadow flex-[200px] border-2 border-black bg-red-700 px-2 font-bold text-white hover:bg-red-900"
				type="reset">Clear</button
			>
		</div>
		<p title="Click to clear form" class="cursor-pointer text-sm text-red-500 hover:text-red-600">
			{form?.message ?? ' '}
		</p>
	</form>
</fieldset>

{#await data.images}
	<p>Loading...</p>
{:then images}
	<fieldset class="fat-shadow my-4 flex flex-row flex-wrap gap-4 border-2 border-black p-2">
		<legend class="bg-white px-2 ps-4 font-bold">Actions</legend>
		<input
			class="form-input border-2 border-black/50 bg-white py-1"
			type="text"
			id="filter"
			bind:value={filterValue}
			placeholder="Filter images by name"
		/>
		<label for="imageSize" class="flex items-center gap-2">
			<span class="w-[6ch]">{imageSize} px</span>
			<input
				class="border-2 border-black bg-white"
				type="range"
				name="imageSize"
				id="imageSize"
				bind:value={imageSize}
				step="50"
				min="50"
				max="400"
			/>
		</label>
		<div>
			<button
				class="fat-shadow flex-[200px] border-2 border-black px-2 font-bold text-white"
				class:bg-green-700={selectMode}
				class:bg-red-700={!selectMode}
				onclick={() => (selectMode = !selectMode)}
				title="Toggle select mode"
			>
				✔ Select Mode is {selectMode ? 'ON' : 'OFF'}
			</button>
			<button
				class="fat-shadow flex-[200px] border-2 border-black bg-red-700 px-2 font-bold text-white disabled:brightness-50"
				disabled={selectedImagesIds.size == 0}
				onclick={() => selectedImagesIds.clear()}
			>
				🗑 Clear selection
			</button>
			<button
				class="fat-shadow flex-[200px] border-2 border-black bg-blue-500 px-2 font-bold text-white disabled:brightness-50"
				disabled={selectedImagesIds.size == 0}
				onclick={() => (shareDialogState = 'open')}
			>
				🔗 Share selected images ({selectedImagesIds.size})
			</button>
		</div>
	</fieldset>
	<p class="my-2">
		Listing {images.length} image{images.length > 1 ? 's' : ''} (filtered = {filteredImages.length},
		selected = {selectedImagesIds.size}).
	</p>
	<ImageGrid
		images={filteredImages.map(smallImageConverter)}
		{imageSize}
		{onimageclick}
		bind:selectedImagesIds
		{selectMode}
	/>
	<Lightbox
		images={filteredImages.map(smallImageConverter)}
		startId={lastClickedImageId}
		bind:displayState={lightboxState}
	/>
{:catch error}
	<p>Error: {error}</p>
{/await}

<ShareDialog {form} bind:show={shareDialogState} />

<style lang="postcss">
	#file::file-selector-button {
		@apply hidden;
	}
</style>
