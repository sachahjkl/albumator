<script lang="ts">
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import ShareForm from '$lib/components/ShareForm.svelte';
	import UploadForm from '$lib/components/UploadForm.svelte';
	import { APP_NAME } from '$lib/constants';
	import LoadingDots from '$lib/icons/LoadingDots.svelte';
	import { imageWithUrl } from '$lib/mappers';
	import { pushPreferences } from '$lib/preferences';
	import type { InsertedImage } from '$lib/server/db/queries';
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let initialImages = $state(untrack(() => [...data.images]));
	let imageIdSet = $derived(new SvelteSet(initialImages.map((i) => i.id)));

	let images = $derived(initialImages.map(imageWithUrl()));
	type Image = (typeof images)[number];

	let selectedImagesIds = $state<SvelteSet<string>>(new SvelteSet());

	const shareDialogShow = () => {
		dialog.showModal();
		dialogOpen = true;
	};

	const shareDialogClose = () => {
		dialog.close();
		dialogOpen = false;
	};

	let dialog = $state() as HTMLDialogElement;
	let dialogOpen = $state(false);

	let currentPage = $state(1);

	const onSuccessfulUpload = (uploadedImages: InsertedImage[]) => {
		initialImages.unshift(...uploadedImages.map(imageWithUrl()));
	};

	const loadNextPage = async () => {
		const nextPage = currentPage + 1;
		const response = await fetch('/images?page=' + nextPage);

		if (!response.ok) {
			throw new Error('Unable to load more images');
		}

		const pageImages: Image[] = await response.json();
		const newImages = pageImages.filter((image) => !imageIdSet.has(image.id));
		initialImages.push(...newImages.map(imageWithUrl()));
		currentPage = nextPage;
		return { hasMore: pageImages.length > 0 };
	};

	const onDeepFilterNeeded = (filter: string) => {
		// TODO: add deep fetch when filter returns no results
		// this event is when a filter is applied and no images came up
		// return initialImages.filter(image => image.name.toLowerCase().includes(filter));
	};

	let selectedSize = $state(untrack(() => data.preferences?.size ?? 'md'));

	$effect(() => {
		let size = selectedSize;
		if (size && data.preferences?.size !== size) {
			pushPreferences(
				{
					...data.preferences,
					size
				},
				(prefs) => {
					data.preferences = prefs;
				}
			);
		}
	});

	let isDeleting = $state(false);
	async function onDeleteClick() {
		isDeleting = true;
		try {
			const imagesToDelete = Array.from(selectedImagesIds);
			const res = await fetch('/images/deleteBatch', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(imagesToDelete)
			});

			if (res.ok) {
				initialImages = initialImages.filter((image) => !imagesToDelete.includes(image.id));
				selectedImagesIds.clear();
			}
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head>
	<title>{APP_NAME} / Home</title>
</svelte:head>

<UploadForm multiple={true} {form} {onSuccessfulUpload} />

<ImageGrid
	{images}
	bind:selectedImagesIds
	onNextPageNeeded={loadNextPage}
	initialFilter={data.initialFilter}
	bind:selectedSize
>
	{#snippet additionalActions()}
		<button
			class="fat-shadow text-sharp border-2 border-black bg-blue-500 px-2 font-bold text-white disabled:brightness-50"
			disabled={selectedImagesIds.size == 0}
			onclick={shareDialogShow}
		>
			🔗 Share selected images
		</button>
		<button
			class="fat-shadow text-sharp border-2 border-black bg-red-500 px-2 font-bold text-white disabled:brightness-50"
			disabled={selectedImagesIds.size == 0 || isDeleting}
			onclick={onDeleteClick}
		>
			{#if isDeleting}
				🗑 Deleting <LoadingDots classname="inline-block fill-white" />
			{:else}
				🗑 Delete selected images
			{/if}
		</button>
	{/snippet}
</ImageGrid>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	onclose={() => (dialogOpen = false)}
	oncancel={() => (dialogOpen = false)}
	class="m-auto w-auto max-w-[800px] bg-transparent"
>
	<ShareForm visible={dialogOpen} imageIds={selectedImagesIds} {form} onclose={shareDialogClose} />
</dialog>

<style lang="postcss">
	dialog::backdrop {
		background-color: rgb(0 0 0 / 15%);
		backdrop-filter: blur(12px);
	}
</style>
