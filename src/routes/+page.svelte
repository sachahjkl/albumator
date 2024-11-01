<script lang="ts">
	import { enhance } from '$app/forms';
	import Header from '$lib/components/Header.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import type { LightImage } from '$lib/server/db/queries';
	import type { ActionData, PageServerData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();

	let filterValue = $state('');

	let imageSize = $state(250);
	let lightboxStatus = $state<'open' | 'closed'>('closed');
	let lastClickedImageId = $state('');
	let selectedImagesIds = $state<string[]>([]);
	let selectMode = $state(false);

	let filteredImages = $state<LightImage[]>([]);

	$effect(() => {
		const filter = textFilter(filterValue);
		data.images.then((images) => {
			filteredImages = images.filter(filter);
		});
	});

	const onimageclick = (imageId: string) => {
		lastClickedImageId = imageId;
		lightboxStatus = 'open';
	};

	const textFilter = (filter: string) => {
		return (value: { name: string }) => value.name.toLowerCase().includes(filter);
	};

	const smallImageConverter = (image: LightImage) => {
		return {
			id: image.id,
			name: image.name,
			url: `/image/${image.id}`
		};
	};
</script>

<Header username={data.user.username} userId={data.user.id} />

<fieldset class="fat-shadow my-2 border-2 border-black p-2">
	<legend class="ms-4 px-2 font-bold">Upload an image</legend>
	<form
		class="flex flex-col gap-4"
		method="post"
		action="?/uploadImage"
		enctype="multipart/form-data"
		use:enhance
	>
		<label for="name">Name</label>
		<input
			placeholder="Name of your image"
			class="border-2 border-black/50 bg-white py-1"
			type="text"
			name="name"
			id="name"
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
			class="border-2 border-black/50 bg-white py-1"
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
		<button
			class="fat-shadow flex-[200px] border-2 border-black px-2 font-bold text-white"
			class:bg-green-700={selectMode}
			class:bg-red-700={!selectMode}
			onclick={() => (selectMode = !selectMode)}
			title="Toggle select mode"
		>
			Select Mode is {selectMode ? 'ON' : 'OFF'}
		</button>
	</fieldset>
	<p class="my-2">
		Listing {images.length} image{images.length > 1 ? 's' : ''} (filtered = {filteredImages.length}).
	</p>
	<ImageGrid
		images={filteredImages.map(smallImageConverter)}
		{imageSize}
		{onimageclick}
		bind:selectedImagesIds
	/>
	<Lightbox
		images={filteredImages.map(smallImageConverter)}
		startId={lastClickedImageId}
		bind:status={lightboxStatus}
	/>
{:catch error}
	<p>Error: {error}</p>
{/await}

<style lang="postcss">
	#file::file-selector-button {
		@apply hidden;
	}
</style>
