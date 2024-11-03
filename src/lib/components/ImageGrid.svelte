<script lang="ts">
	import { textFilter } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { fly } from 'svelte/transition';
	import FilterInput from './FilterInput.svelte';
	import Lightbox from './Lightbox.svelte';

	type GridImage = {
		id: string;
		name: string;
		url: string;
	};

	type ImageGridProps = {
		images: GridImage[];
		filteredImages?: GridImage[];
		selectedImagesIds?: SvelteSet<string>;
		sizes?: number[];
		pageSizes?: number[];
		defaultPageSize?: number;
		defaultSize?: number;
		defaultFilter?: string;
		enableResizable?: boolean;
		enableSelectable?: boolean;
		enableLightbox?: boolean;
		displayMode?: 'grid' | 'list';
		groupMode?: 'month' | 'all';
		additionalActions?: Snippet;
		onimageclick?: (imageId: string) => void;
	};

	let {
		images,
		selectedImagesIds = $bindable(new SvelteSet<string>()),
		sizes = [50, 100, 200, 250, 300],
		defaultSize = 200,
		enableResizable = true,
		enableSelectable = true,
		enableLightbox = true,
		displayMode = 'grid',
		groupMode = 'all',
		additionalActions,
		onimageclick = () => {}
	}: ImageGridProps = $props();

	// Lightbox state
	let lightboxOpen = $state<'open' | 'closed'>('closed');
	let lastClickedImage = $state<GridImage>();

	// Filter state
	let filterValue = $state('');
	let filter = $derived(textFilter(filterValue));
	let filteredImages = $derived(images.filter(filter));

	// Selection state
	let someImagesSelected = $derived(selectedImagesIds.size > 0);

	// Resizable state
	let defaultIdx = sizes.indexOf(defaultSize) ?? 0;
	let sizeIdx = $state(defaultIdx);
	let currentSize = $derived(sizes.at(sizeIdx));

	let currentlastImageRef = $state<HTMLImageElement>();

	const onclick = (image: GridImage) => {
		if (someImagesSelected) return;
		onimageclick(image.id);
		lastClickedImage = image;
		lightboxOpen = 'open';
	};

	const select = (select: boolean, id: string) => {
		if (select) {
			selectedImagesIds.add(id);
		} else {
			selectedImagesIds.delete(id);
		}
	};
</script>

<fieldset class="fat-shadow my-4 flex flex-row flex-wrap gap-4 border-2 border-black bg-white p-2">
	<legend class=" px-2 ps-4 font-bold">Actions</legend>
	{#if enableResizable}
		<FilterInput
			items={images}
			bind:filterValue
			filterLogic={filter}
			placeholder="Filter images by name"
		/>
	{/if}
	{#if enableResizable}
		<label for="imageSize" class="flex items-center gap-2">
			<span class="w-[6ch]">{currentSize} px</span>
			<input
				class="border-2 border-black bg-white"
				type="range"
				name="imageSize"
				id="imageSize"
				value={defaultIdx}
				oninput={(e) => (sizeIdx = Number.parseInt((e.target as HTMLInputElement).value))}
				step="1"
				min="0"
				max={sizes.length - 1}
			/>
		</label>
	{/if}
</fieldset>

<section class="relative">
	{#if someImagesSelected}
		<div transition:fly={{ y: -20, duration: 200 }} class="sticky top-16 z-10 flex flex-wrap gap-4">
			<button
				class="fat-shadow border-2 border-black bg-red-700 px-2 font-bold text-white disabled:brightness-50"
				disabled={selectedImagesIds.size == 0}
				onclick={() => selectedImagesIds.clear()}
			>
				🗑 Clear selection
			</button>
			{#if additionalActions}
				{@render additionalActions()}
			{/if}
		</div>
	{/if}

	<div
		class="my-4 grid grid-flow-row grid-cols-imageGrid gap-4"
		style="--image-size: {currentSize}px"
	>
		{#each filteredImages as image, imageIdx (image.id)}
			{@const isSelected = selectedImagesIds.has(image.id)}
			<div class="group fat-shadow relative cursor-pointer border-2 border-black bg-white">
				<div class:brightness-50={isSelected} class="flex h-full flex-col justify-stretch">
					<p
						class:group-hover:bg-blue-700={!isSelected}
						class="flex h-14 gap-2 border-b-2 border-black bg-blue-500 p-2 py-2 font-bold text-white"
					>
						<span class="title inline-block truncate" title="{image.name} (click to edit)">
							{image.name}
						</span> ✏
					</p>

					<button
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								onclick(image);
							}
						}}
						onclick={() => onclick(image)}
						class="aspect-h-1 aspect-w-1"
					>
						<!-- TODO: do something to detect last image and trigger image loading -->
						{#if imageIdx === filteredImages.length - 1}
							<img
								class="h-full w-full object-cover object-center"
								loading="lazy"
								src={image.url}
								alt={image.name}
								bind:this={currentlastImageRef}
							/>
						{:else}
							<img
								class="h-full w-full object-cover object-center"
								loading="lazy"
								src={image.url}
								alt={image.name}
							/>
						{/if}
					</button>
				</div>
				{#if enableSelectable}
					<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
						<button
							class:opacity-50={!isSelected}
							class:hidden={!isSelected}
							onclick={() => select(!isSelected, image.id)}
							type="button"
							title="Un/select image {image.name}"
							class="bg-black/30py-2 pointer-events-auto rounded
							text-5xl font-bold text-white hover:opacity-100 group-hover:block">✔</button
						>
					</div>
				{/if}
			</div>
		{:else}
			<p>No images found.</p>
		{/each}
	</div>
</section>

{#if enableLightbox}
	<Lightbox images={filteredImages} firstId={lastClickedImage?.id} bind:open={lightboxOpen} />
{/if}
