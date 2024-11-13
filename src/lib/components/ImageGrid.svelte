<script lang="ts">
	import { goto } from '$app/navigation';
	import { textFilter, onKeysDown } from '$lib/utils';
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

	const onGeneralImageClick = (image: GridImage) => {
		if (someImagesSelected) {
			onSelectClick(image);
		} else {
			onimageclick(image.id);
			lastClickedImage = image;
			lightboxOpen = 'open';
		}
	};

	const onSelectClick = (image: GridImage) => {
		let isSelected = selectedImagesIds.has(image.id);
		select(!isSelected, image.id);
	};

	const select = (select: boolean, id: string) => {
		if (select) {
			selectedImagesIds.add(id);
		} else {
			selectedImagesIds.delete(id);
		}
		latestClickSelectMode = select;
	};

	let latestClickSelectMode = $state(false);
	let mouseDown = $state(false);

	const onMouse = (e: MouseEvent, state: 'up' | 'down') => {
		if (e.button === 0) {
			mouseDown = state === 'down';
		}
	};

	const onImageMouseEnter = (imageSelectionState: boolean, image: GridImage) => {
		if (someImagesSelected && mouseDown) {
			// I've got a choice here, either this (toggles the image selection state)
			// select(!imageSelectionState, image.id);
			// or this (sets to the mode of the latest [un]selected image)
			select(latestClickSelectMode, image.id);
		}
	};
</script>

<svelte:window on:mousedown={(e) => onMouse(e, 'down')} on:mouseup={(e) => onMouse(e, 'up')} />

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
	{#if enableSelectable}
		<div class:sticky={someImagesSelected} class=" top-16 z-10 flex flex-wrap items-center gap-4">
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
	{/if}

	<div
		class="my-4 grid grid-flow-row grid-cols-imageGrid gap-4"
		style="--image-size: {currentSize}px"
	>
		{#each filteredImages as image, imageIdx (image.id)}
			{@const isSelected = selectedImagesIds.has(image.id)}
			<div
				role="button"
				tabindex="0"
				onkeydown={(e) => onKeysDown(['Enter'], e, () => onGeneralImageClick(image))}
				transition:scale={{ duration: 100 }}
				class="group fat-shadow relative cursor-pointer border-2 border-black bg-white
				outline-8 focus:outline-dotted focus:outline-offset-4 focus:outline-blue-400"
			>
				<section
					role="button"
					tabindex="0"
					onmouseenter={() => onImageMouseEnter(isSelected, image)}
					class:p-4={isSelected}
					class="bg-green-200 transition-all will-change-auto"
				>
					<div
						class:shadow-inner={someImagesSelected && !isSelected}
						class:border-green-500={isSelected}
						class:border-2={isSelected}
						class="fat-shadow flex h-full flex-col"
					>
						<p
							class:group-hover:bg-blue-700={!isSelected}
							class="flex h-14 gap-2 border-b-2 border-black bg-blue-500 p-2 py-2 font-bold
							text-white"
						>
							<span class="title inline-block truncate" title="{image.name} (click to edit)">
								{image.name}
							</span> ✏
						</p>

						<button
							type="button"
							onmousedown={() => onGeneralImageClick(image)}
							class="aspect-h-1 aspect-w-1 focus:outline-2"
						>
							<!-- TODO: do something to detect last image and trigger image loading -->
							<!-- TODO: make zooming in the image work  (div mapped to cursor position with increased size)-->
							{#if imageIdx === filteredImages.length - 1}
								<img
									class="h-full w-full bg-white object-cover object-center"
									loading="lazy"
									src={image.url}
									alt={image.name}
									bind:this={currentlastImageRef}
									draggable="false"
								/>
							{:else}
								<img
									class="h-full w-full bg-white object-cover object-center"
									loading="lazy"
									src={image.url}
									alt={image.name}
									draggable="false"
								/>
							{/if}
						</button>
					</div>
					{#if enableSelectable}
						<div class="pointer-events-none absolute inset-0 flex items-end justify-end p-4">
							<button
								class:hidden={!(isSelected || someImagesSelected)}
								onkeydown={(e) =>
									onKeysDown(['Enter', 'Space'], e, () => onGeneralImageClick(image))}
								onmousedown={() => onSelectClick(image)}
								type="button"
								title="Un/select image {image.name}"
								class="fat-shadow pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full
								border-2 border-black bg-white/80 text-lg font-bold hover:opacity-100 group-hover:flex"
							>
								{isSelected ? '✔' : ' '}
							</button>
						</div>
					{/if}
				</section>
			</div>
		{:else}
			<p>No images found.</p>
		{/each}
	</div>
</section>

{#if enableLightbox}
	<Lightbox images={filteredImages} firstId={lastClickedImage?.id} bind:open={lightboxOpen} />
{/if}
