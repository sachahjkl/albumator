<script lang="ts">
	import type { UserImage } from '$lib/server/db/queries';

	type ImageGridProps = {
		images: UserImage[];
		filter: (name: UserImage) => boolean;
		imageSize: number;
		displayMode?: 'grid' | 'list';
		groupMode?: 'month' | 'all';
		onimageclick?: (image: UserImage) => void;
		lastClickedImage: UserImage | undefined;
	};
	let {
		images,
		filter,
		imageSize,
		displayMode = 'list',
		groupMode = 'all',
		onimageclick = () => {},
		lastClickedImage = $bindable()
	}: ImageGridProps = $props();

	const onclick = (image: UserImage) => {
		lastClickedImage = image;
		console.log('last clicked image', { lastClickedImage });
		onimageclick(image);
	};
</script>

<div class="flex grid-cols-3 flex-wrap gap-4" style="--image-size: {imageSize}px">
	{#each images as image}
		<div
			class:filtered={filter(image) == false}
			class="fat-shadow group w-[--image-size] border-2 border-black bg-white hover:bg-blue-50"
		>
			<p
				title="{image.name} ({image.mimeType}) (click to edit)"
				class="h-16 cursor-pointer truncate border-b-2 border-black bg-blue-500 p-2 font-bold text-white group-hover:bg-blue-700"
			>
				{image.name} ({image.mimeType}) ✏
			</p>
			<div class="">
				<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
				<img
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							onclick(image);
						}
					}}
					onclick={() => onclick(image)}
					class="block h-[--image-size] w-[--image-size] object-cover"
					loading="lazy"
					src="/image/{image.id}"
					alt={image.name}
				/>
			</div>
		</div>
	{:else}
		<p>No images found.</p>
	{/each}
</div>

<style>
	.filtered {
		display: none;
	}
</style>
