<script lang="ts">
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import ShareForm from '$lib/components/ShareForm.svelte';
	import UploadForm from '$lib/components/UploadForm.svelte';
	import { APP_NAME } from '$lib/constants';
	import { imageWithUrl } from '$lib/mappers';
	import { pushPreferences } from '$lib/preferences';
	import type { InsertedImage } from '$lib/server/db/queries';
	import { SvelteSet } from 'svelte/reactivity';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let initialImages = $state(data.images);
	let imageIdSet = $derived(new SvelteSet(initialImages.map((i) => i.id)));

	let images = $derived(initialImages.map(imageWithUrl()));
	type Image = (typeof images)[number];

	let selectedImagesIds = $state<SvelteSet<string>>(new SvelteSet());

	const onShareClick = () => {
		dialog.showModal();
	};

	let dialog = $state() as HTMLDialogElement;

	let currentPage = $state(1);

	const onSuccessfulUpload = (uploadedImages: InsertedImage[]) => {
		initialImages.unshift(...uploadedImages.map(imageWithUrl()));
	};

	const loadNextPage = async () => {
		currentPage++;
		let reachedEnd = await fetch('/images?page=' + currentPage)
			.then((r) => r.json())
			.then((images: Image[]) => {
				const newImages = images.filter((image) => !imageIdSet.has(image.id));
				initialImages.push(...newImages.map(imageWithUrl()));
				return newImages.length > 0;
			});
		return { reachedEnd };
	};

	const onDeepFilterNeeded = (filter: string) => {
		// TODO: add deep fetch when filter returns no results
		// this event is when a filter is applied and no images came up
		// return initialImages.filter(image => image.name.toLowerCase().includes(filter));
	};

	let selectedSize = $state(data.preferences?.size ?? 'md');

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

	async function onDeleteClick() {
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
	}
</script>

<svelte:head>
	<title>{APP_NAME} / Home</title>
</svelte:head>

<UploadForm multiple={true} {form} {onSuccessfulUpload} />

<!-- TODO: Make images editable/deletable if allowed -->

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
			onclick={onShareClick}
		>
			🔗 Share selected images
		</button>
		<button
			class="fat-shadow text-sharp border-2 border-black bg-red-500 px-2 font-bold text-white disabled:brightness-50"
			disabled={selectedImagesIds.size == 0}
			onclick={onDeleteClick}
		>
			🗑 Delete selected images
		</button>
	{/snippet}
</ImageGrid>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dialog} class="w-auto max-w-[800px] bg-transparent">
	<ShareForm imageIds={selectedImagesIds} {form} onclose={() => dialog.close()} />
</dialog>

<style lang="postcss">
	dialog::backdrop {
		@apply bg-black bg-opacity-15 backdrop-blur-md;
	}
</style>
