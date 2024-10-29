<script lang="ts">
	import { enhance } from '$app/forms';
	import Header from '$lib/components/Header.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import type { UserImage } from '$lib/server/db/queries';
	import type { ActionData, PageServerData } from './$types';

	let { data, form }: { data: PageServerData; form: ActionData } = $props();

	let filter = $state('');

	let imageSize = $state(250);
	let lightboxStatus = $state<'open' | 'closed'>('closed');
	let lastClickedImage: UserImage | undefined = $state();

	const openLightbox = () => {
		lightboxStatus = 'open';
	};

	const passesFilter = (value: UserImage) => {
		return value.name.toLowerCase().includes(filter.toLowerCase());
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
		<div class="flex items-center gap-4">
			<label
				for="file"
				class="block flex-grow cursor-pointer border-2 border-black bg-indigo-500 px-2 py-1 text-center text-white hover:bg-indigo-700"
			>
				🖼 Choose your image
			</label>
			<input class="block flex-grow cursor-pointer" type="file" name="file" id="file" />
		</div>
		<div class="flex items-center gap-4">
			<button
				class="fat-shadow flex-grow border-2 border-black bg-green-700 px-2 font-bold text-white hover:bg-green-900"
				type="submit">Upload</button
			>
			<button
				class="fat-shadow flex-grow border-2 border-black bg-red-700 px-2 font-bold text-white hover:bg-red-900"
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
			bind:value={filter}
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
	</fieldset>
	<p class="my-2">Found {images.filter(passesFilter).length} images.</p>
	<ImageGrid
		{images}
		filter={passesFilter}
		{imageSize}
		onimageclick={openLightbox}
		bind:lastClickedImage
	/>
	<Lightbox
		images={images.filter(passesFilter).map((image) => ({
			id: image.id,
			title: image.name,
			url: `/image/${image.id}`
		}))}
		selectedId={lastClickedImage?.id}
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
