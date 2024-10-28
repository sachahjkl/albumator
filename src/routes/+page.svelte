<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageServerData } from './$types';

	let { data }: { data: PageServerData } = $props();

	let filter = $state('');

	const passesFilter = (value: string) => {
		return value.toLowerCase().includes(filter.toLowerCase());
	};
</script>

<article class="container mx-auto">
	<h1>Hi, {data.user.username} (ID={data.user.id})!</h1>
	<form method="post" action="?/logout" use:enhance>
		<button type="submit">Sign out</button>
	</form>

	<hr />

	<fieldset class="border-2 border-black p-2">
		<legend class="ms-4">Upload Image</legend>
		<form method="post" action="?/uploadImage" enctype="multipart/form-data" use:enhance>
			<label for="name">Name</label>
			<input type="text" name="name" id="name" />
			<label for="file">File</label>
			<input type="file" name="file" id="file" />
			<button type="submit">Upload</button>
		</form>
	</fieldset>

	<h2>Images</h2>
	{#await data.images}
		<p>Loading...</p>
	{:then images}
		<div>
			<input type="text" id="filter" bind:value={filter} />
			<p>Found {images.length} images.</p>
		</div>
		<div class="flex grid-cols-3 flex-wrap gap-4">
			{#each images as image}
				<div
					class:filtered={passesFilter(image.name) == false}
					class="w-[200px] border-2 border-black p-2"
				>
					<img
						loading="lazy"
						class="border-3 border-black"
						src="/image/{image.id}"
						alt={image.name}
					/>
					<p>{image.name} ({image.mimeType})</p>
				</div>
			{:else}
				<p>No images found.</p>
			{/each}
		</div>
	{/await}
</article>

<style>
	.filtered {
		display: none;
	}
</style>
