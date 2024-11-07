<script lang="ts">
	import { goto } from '$app/navigation';
	import { textFilter } from '$lib/utils';
	import { onMount, type Snippet } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { scale } from 'svelte/transition';
	import FilterInput from './FilterInput.svelte';
	import Lightbox from './Lightbox.svelte';

	type GridImage = {
		id: string;
		name: string;
		url: string;
	};

	type ImageGridProps = {
		images: GridImage[];
		selectedImagesIds?: SvelteSet<string>;
		sizes?: Record<string, number>;
		initialFilter?: string;
		defaultSize?: string;
		defaultFilter?: string;
		enableResizable?: boolean;
		enableSelectable?: boolean;
		enableLightbox?: boolean;
		enableDeepSearch?: boolean;
		displayMode?: 'grid' | 'list';
		groupMode?: 'month' | 'all';
		additionalActions?: Snippet;
		onImageClick?: (imageId: string) => void;
		onNextPageNeeded?: () => void;
		onDeepFilterNeeded?: (filter: string) => GridImage[];
	};

	let {
		images,
		selectedImagesIds = $bindable(new SvelteSet<string>()),
		sizes = {
			xs: 100,
			sm: 200,
			md: 250,
			lg: 300
		},
		initialFilter = '',
		defaultSize = 'md',
		enableResizable = true,
		enableSelectable = true,
		enableLightbox = true,
		enableDeepSearch = true,
		displayMode = 'grid',
		groupMode = 'all',
		additionalActions,
		onImageClick: onimageclick = () => {},
		onNextPageNeeded = () => {},
		onDeepFilterNeeded = () => []
	}: ImageGridProps = $props();

	// Lightbox state
	let lightboxOpen = $state<'open' | 'closed'>('closed');
	let lastClickedImage = $state<GridImage>();

	// Filter state
	let filterValue = $state(initialFilter);
	let filter = $derived(textFilter(filterValue));
	let filteredImages = $derived(images.filter(filter));

	// Selection state
	let someImagesSelected = $derived(selectedImagesIds.size > 0);

	// Resizable state
	let currentSizeKey = $state(defaultSize);
	let currentSize = $derived(sizes[currentSizeKey]);

	// Infinite scroll state
	let currentlastImageRef = $state<HTMLImageElement>();

	let observer: IntersectionObserver;

	onMount(() => {
		const options = {
			root: document.body,
			rootMargin: '0px 0px 200px 0px',
			threshold: 0.25
		};
		observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) {
				onNextPageNeeded();
			}
		}, options);
		// observer.observe(document.querySelector('.grid-container'));
	});

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
			bind:filterValue
			placeholder="Filter images by name"
			oninput={(filter) =>
				goto(`?filter=${filter}`, {
					keepFocus: true
				})}
		/>
	{/if}
	{#if enableResizable}
		<label for="imageSize" class="flex flex-col items-start gap-1">
			<div>Current size: <span class="w-[3ch] font-bold">{currentSizeKey}</span></div>
			<input
				class="border-2 border-black bg-white"
				type="range"
				name="imageSize"
				id="imageSize"
				value={Object.keys(sizes).indexOf(currentSizeKey)}
				oninput={(e) =>
					(currentSizeKey =
						Object.keys(sizes).at(Number.parseInt((e.target as HTMLInputElement).value)) ??
						defaultSize)}
				step="1"
				min="0"
				max={Object.keys(sizes).length - 1}
			/>
		</label>
	{/if}
</fieldset>

<section class="relative">
	<!-- {#if someImagesSelected} -->
	<div class="sticky top-16 z-10 flex flex-wrap items-center gap-4">
		<button
			class="fat-shadow border-2 border-black bg-gray-500 px-2 font-bold text-white disabled:brightness-50"
			disabled={selectedImagesIds.size == 0}
			onclick={() => selectedImagesIds.clear()}
		>
			❌ Clear selection ({selectedImagesIds.size})
		</button>
		{#if additionalActions}
			{@render additionalActions()}
		{/if}
	</div>
	<!-- {/if} -->

	<div
		class="my-4 grid grid-flow-row grid-cols-imageGrid gap-4"
		style="--image-size: {currentSize}px"
	>
		{#each filteredImages as image, imageIdx (image.id)}
			{@const isSelected = selectedImagesIds.has(image.id)}
			<div
				transition:scale={{ duration: 100 }} 
				class="group fat-shadow relative cursor-pointer border-2 border-black bg-white"
			>
				<div
					class:brightness-50={someImagesSelected && !isSelected}
					class:p-4={isSelected}
					class:border-green-500={isSelected}
					class:border-2={isSelected}
					class="flex h-full flex-col justify-stretch bg-green-200 transition-all"
				>
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
					<div class="pointer-events-none absolute inset-0 flex items-end justify-end p-4">
						<button
							class:opacity-50={!isSelected}
							class:hidden={!(isSelected || someImagesSelected)}
							class:bg-green-200={isSelected}
							class:bg-white={!isSelected}
							onclick={() => select(!isSelected, image.id)}
							type="button"
							title="Un/select image {image.name}"
							class="fat-shadow pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-white/60 text-lg
							font-bold text-white hover:opacity-100 group-hover:flex">✔</button
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
