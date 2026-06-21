<script lang="ts">
	import { goto } from '$app/navigation';
	import { longPress } from '$lib/actions.svelte';
	import { onKeysDown, textFilter } from '$lib/utils';
	import { onMount, untrack, type Snippet } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { scale } from 'svelte/transition';
	import { WindowVirtualizer } from 'virtua/svelte';
	import FilterInput from './FilterInput.svelte';
	import Lightbox from './Lightbox.svelte';
	import ResponsiveImage from './ResponsiveImage.svelte';

	type WindowVirtualizerHandle = {
		getScrollOffset(): number;
		getViewportSize(): number;
		findItemIndex(offset: number): number;
	};

	type GridImage = {
		id: string;
		name: string;
		url: string;
		width: number;
		height: number;
		thumbHash: string;
		shareId?: string;
	};

	type ImageGridProps = {
		images: GridImage[];
		selectedImagesIds?: SvelteSet<string>;
		sizes?: Record<string, number>;
		initialFilter?: string;
		selectedSize?: string;
		defaultFilter?: string;
		enableResizable?: boolean;
		enableSelectable?: boolean;
		enableLightbox?: boolean;
		enableDeepSearch?: boolean;
		displayMode?: 'grid' | 'list';
		groupMode?: 'month' | 'all';
		additionalActions?: Snippet;
		onImageClick?: (imageId: string) => void;
		onNextPageNeeded?: () => Promise<{ reachedEnd: boolean }>;
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
		selectedSize = $bindable('md'),
		enableResizable = true,
		enableSelectable = true,
		enableLightbox = true,
		enableDeepSearch = true,
		displayMode = 'grid',
		groupMode = 'all',
		additionalActions,
		onImageClick: onimageclick = () => {},
		onNextPageNeeded = async () => ({ reachedEnd: false }),
		onDeepFilterNeeded = () => []
	}: ImageGridProps = $props();

	// Lightbox state
	let lightboxOpen = $state<'open' | 'closed'>('closed');
	let lastClickedImage = $state<GridImage>();

	// Filter state
	let filterValue = $state(untrack(() => initialFilter));
	let filter = $derived(textFilter(filterValue));
	let filteredImages = $derived(images.filter(filter));

	// Selection state
	let someImagesSelected = $derived(selectedImagesIds.size > 0);

	// Resizable state
	let currentSize = $derived(sizes[selectedSize]);
	let sizeNames = $derived(Object.keys(sizes));
	let currentSizeIdx = $derived(sizeNames.indexOf(selectedSize));

	const onresizeinput = (e: Event) => {
		selectedSize = sizeNames[Number.parseInt((e.target as HTMLInputElement).value)];
	};

	// Infinite scroll state
	let keepAskingForImages = true;
	let isLoadingNextPage = $state(false);
	let gridContainer = $state<HTMLElement>();
	let virtualizer = $state<WindowVirtualizerHandle>();
	let containerWidth = $state(0);
	const gridGap = 16;
	const cardHeaderHeight = 56;

	let columnCount = $derived(
		Math.max(
			1,
			Math.floor((Math.max(containerWidth, currentSize) + gridGap) / (currentSize + gridGap))
		)
	);
	let currentColumnWidth = $derived(
		Math.max(
			currentSize,
			Math.floor(
				(Math.max(containerWidth, currentSize) - gridGap * (columnCount - 1)) / columnCount
			)
		)
	);
	let responsiveSizes = $derived(
		`(max-width: 768px) calc((100vw - 0.5rem - ${gridGap * (columnCount - 1)}px) / ${columnCount}), ${currentColumnWidth}px`
	);
	let virtualRowHeight = $derived(currentColumnWidth + cardHeaderHeight + gridGap);
	let rowItems = $derived.by(() => {
		let rows: GridImage[][] = [];

		for (let index = 0; index < filteredImages.length; index += columnCount) {
			rows.push(filteredImages.slice(index, index + columnCount));
		}

		return rows;
	});

	const loadMoreIfNeeded = async () => {
		if (!virtualizer || !keepAskingForImages || isLoadingNextPage || rowItems.length === 0) {
			return;
		}

		const viewportEnd = virtualizer.getScrollOffset() + virtualizer.getViewportSize();
		const visibleRowIndex = virtualizer.findItemIndex(viewportEnd);
		const shouldLoadMore = visibleRowIndex >= Math.max(0, rowItems.length - 2);

		if (!shouldLoadMore) {
			return;
		}

		isLoadingNextPage = true;

		try {
			keepAskingForImages = (await onNextPageNeeded()).reachedEnd;
		} finally {
			isLoadingNextPage = false;
		}
	};

	onMount(() => {
		const resizeObserver = new ResizeObserver(([entry]) => {
			containerWidth = entry?.contentRect.width ?? 0;
		});

		if (gridContainer) {
			resizeObserver.observe(gridContainer);
			containerWidth = gridContainer.clientWidth;
		}

		return () => {
			resizeObserver.disconnect();
		};
	});

	$effect(() => {
		void loadMoreIfNeeded();
	});

	const generalImageClick = (image: GridImage) => {
		if (someImagesSelected) {
			selectClick(image);
		} else {
			regularClick(image);
		}
	};

	let clickCooldown = $state(false);

	const regularClick = (image: GridImage) => {
		onimageclick(image.id);
		lastClickedImage = image;
		lightboxOpen = 'open';
	};

	const selectClick = (image: GridImage) => {
		let isSelected = selectedImagesIds.has(image.id);
		select(!isSelected, image.id);
	};

	const select = (shouldSelect: boolean, id: string) => {
		if (shouldSelect) {
			selectedImagesIds.add(id);
		} else {
			selectedImagesIds.delete(id);
		}
		latestClickSelectMode = shouldSelect;
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
	<legend class=" text-sharp px-2 ps-4 font-bold">Actions</legend>
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
			<div>Current size: <span class="w-[3ch] font-bold">{selectedSize}</span></div>
			<input
				class="box-border cursor-pointer border-2 border-black bg-white accent-blue-500"
				type="range"
				name="imageSize"
				id="imageSize"
				value={currentSizeIdx}
				oninput={onresizeinput}
				step="1"
				min="0"
				max={Object.keys(sizes).length - 1}
			/>
		</label>
	{/if}
</fieldset>

<section class="relative">
	{#if enableSelectable}
		<div class:sticky={someImagesSelected} class="top-16 z-10 flex flex-wrap items-center gap-4">
			<button
				class="fat-shadow text-sharp border-2 border-black bg-gray-500 px-2 font-bold text-white disabled:brightness-50"
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

	<div bind:this={gridContainer} class="mt-4" style="--image-size: {currentSize}px">
		{#if filteredImages.length === 0}
			<p>No images found.</p>
		{:else}
			<WindowVirtualizer
				bind:this={virtualizer}
				data={rowItems}
				itemSize={virtualRowHeight}
				getKey={(_row: GridImage[], index: number) => index}
				onscroll={() => {
					void loadMoreIfNeeded();
				}}
			>
				{#snippet children(row: GridImage[], rowIndex: number)}
					<div class="mb-4 flex gap-4" style="height: {virtualRowHeight - gridGap}px">
						{#each row as image, columnIndex (image.id)}
							{@const imageIdx = rowIndex * columnCount + columnIndex}
							{@const isSelected = selectedImagesIds.has(image.id)}
							<div
								role="button"
								tabindex="0"
								use:longPress={{ duration: 500 }}
								onlongpress={() => {
									if (enableSelectable && clickCooldown == false) {
										selectClick(image);
									}
									clickCooldown = false;
								}}
								onkeydown={(e) => onKeysDown(['Enter'], e, () => generalImageClick(image))}
								transition:scale={{ duration: 100 }}
								class="group fat-shadow relative cursor-pointer border-2 border-black bg-white outline-8 focus:outline-offset-4 focus:outline-blue-400 focus:outline-dotted"
								style="width: {currentColumnWidth}px"
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
											class="flex h-14 gap-2 border-b-2 border-black bg-blue-500 p-2 py-2 font-bold text-white"
										>
											<span class="title inline-block truncate">{image.name}</span>
										</p>

										<button
											type="button"
											onmousedown={() => {
												if (someImagesSelected == true) {
													if (selectedImagesIds.size == 1) {
														clickCooldown = true;
													}
													selectClick(image);
												}
											}}
											onclick={() => {
												if (someImagesSelected == false && clickCooldown == false) {
													regularClick(image);
												}

												clickCooldown = false;
											}}
											class="aspect-square focus:outline-2"
										>
											<ResponsiveImage
												id={image.id}
												name={image.name}
												width={image.width}
												height={image.height}
												thumbHash={image.thumbHash}
												displayWidth={currentColumnWidth}
												sizes={responsiveSizes}
												shareId={image.shareId}
											/>
										</button>
									</div>
									{#if enableSelectable}
										<div
											class="pointer-events-none absolute inset-0 flex items-end justify-end p-4"
										>
											<button
												class:hidden={!(isSelected || someImagesSelected)}
												onkeydown={(e) =>
													onKeysDown(['Enter', 'Space'], e, () => generalImageClick(image))}
												onmousedown={() => selectClick(image)}
												type="button"
												title="Un/select image {image.name}"
												class="fat-shadow pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-white/80 text-lg font-bold group-hover:flex hover:opacity-100"
											>
												{isSelected ? '✔' : ' '}
											</button>
										</div>
									{/if}
								</section>
							</div>
						{/each}
					</div>
				{/snippet}
			</WindowVirtualizer>
		{/if}
	</div>
</section>

{#if enableLightbox}
	<Lightbox images={filteredImages} firstId={lastClickedImage?.id} bind:open={lightboxOpen} />
{/if}
