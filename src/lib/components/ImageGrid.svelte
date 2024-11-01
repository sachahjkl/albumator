<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';

	type GridImage = {
		id: string;
		name: string;
		url: string;
	};

	type ImageGridProps = {
		images: GridImage[];
		selectedImagesIds: SvelteSet<string>;
		imageSize: number;
		displayMode?: 'grid' | 'list';
		groupMode?: 'month' | 'all';
		selectMode?: boolean;
		onimageclick?: (imageId: string) => void;
	};

	let {
		images,
		imageSize,
		displayMode = 'list',
		groupMode = 'all',
		onimageclick = () => {},
		selectedImagesIds = $bindable(new SvelteSet<string>()),
		selectMode = $bindable(false)
	}: ImageGridProps = $props();

	const onclick = (image: GridImage) => {
		onimageclick(image.id);
	};

	const onSelect = (action: 'select' | 'unselect', id: string) => {
		if (action === 'select') {
			selectedImagesIds.add(id);
		} else {
			selectedImagesIds.delete(id);
		}
		console.log({ selectedImagesIds });
	};
</script>

<div class="my-4 flex grid-cols-3 flex-wrap gap-4" style="--image-size: {imageSize}px">
	{#each images as image (image.id)}
		<div
			class="group fat-shadow relative basis-[--image-size] cursor-pointer border-2 border-black bg-white hover:bg-blue-50"
		>
			{#if selectMode}
				<button
					class="absolute inset-0 z-10 flex items-center justify-center gap-2 opacity-90"
					aria-label="Select image {image.name}"
					onclick={() => {
						const isSelected = selectedImagesIds.has(image.id);
						onSelect(isSelected ? 'unselect' : 'select', image.id);
					}}
				>
					<p class="pointer-events-none text-5xl font-bold text-white">
						{selectedImagesIds.has(image.id) ? '✔' : ''}
					</p>
				</button>
			{/if}
			<div class:brightness-50={selectMode}>
				<p
					class:group-hover:bg-blue-700={!selectMode}
					class="flex h-16 items-center gap-2 border-b-2 border-black bg-blue-500 p-2 font-bold text-white"
				>
					<span class="title inline-block truncate" title="{image.name} (click to edit)">
						{image.name}
					</span> ✏
				</p>
				<div>
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<img
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								onclick(image);
							}
						}}
						onclick={() => {
							if (selectMode) return;
							onclick(image);
						}}
						class:brightness-75={!selectMode}
						class="block h-[--image-size] w-[--image-size] object-cover"
						loading="lazy"
						src="/images/{image.id}"
						alt={image.name}
					/>
				</div>
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
