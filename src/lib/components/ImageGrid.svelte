<script lang="ts">
	type GridImage = {
		id: string;
		name: string;
		url: string;
	};

	type ImageGridProps = {
		images: GridImage[];
		selectedImagesIds: string[];
		imageSize: number;
		displayMode?: 'grid' | 'list';
		groupMode?: 'month' | 'all';
		onimageclick?: (imageId: string) => void;
	};

	let {
		images,
		imageSize,
		displayMode = 'list',
		groupMode = 'all',
		onimageclick = () => {},
		selectedImagesIds = $bindable([])
	}: ImageGridProps = $props();

	const onclick = (image: GridImage) => {
		onimageclick(image.id);
	};
</script>

<div class="my-4 flex grid-cols-3 flex-wrap gap-4" style="--image-size: {imageSize}px">
	{#each images as image (image.id)}
		<div
			class="group fat-shadow basis-[--image-size] border-2 border-black bg-white hover:bg-blue-50"
		>
			<p
				class="flex h-16 cursor-pointer items-center gap-2 border-b-2 border-black bg-blue-500 p-2 font-bold text-white group-hover:bg-blue-700"
			>
				<span class="title inline-block truncate" title="{image.name} (click to edit)">
					{image.name}
				</span> ✏
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
					class="block h-[--image-size] w-[--image-size] object-cover hover:brightness-75"
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
	.title {
		max-width: calc(var(--image-size) - 52px);
	}
</style>
