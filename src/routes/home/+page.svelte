<script lang="ts">
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import ShareForm from '$lib/components/ShareForm.svelte';
	import UploadForm from '$lib/components/UploadForm.svelte';
	import { APP_NAME } from '$lib/constants';
	import { imageWithUrl } from '$lib/mappers';
	import type { InsertedImage } from '$lib/server/db/queries';
	import { SvelteSet } from 'svelte/reactivity';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let initialImages = $state(data.images);

	let images = $derived(initialImages.map(imageWithUrl()));

	let selectedImagesIds = $state<SvelteSet<string>>(new SvelteSet());

	const onShareClick = () => {
		dialog.showModal();
	};

	let dialog = $state() as HTMLDialogElement;

	let currentPage = $state(1);

	const onUploadSuccessful = (uploadedImages: InsertedImage[]) => {
		initialImages.unshift(...uploadedImages.map(imageWithUrl()));
	};

	const loadNextPage = () => {
		currentPage++;
		// TODO: add infinite scroll
		console.log('loading next page', { currentPage });
	};
</script>

<svelte:head>
	<title>{APP_NAME} / Home</title>
</svelte:head>

<UploadForm multiple={true} {form} onSuccessfulUpload={onUploadSuccessful} />

<!-- TODO: Make images editable/deletable if allowed -->
<!-- TODO: Add a button to delete multiple images -->

<ImageGrid
	{images}
	bind:selectedImagesIds
	onNextPageNeeded={loadNextPage}
	initialFilter={data.initialFilter}
>
	{#snippet additionalActions()}
		<button
			class="fat-shadow border-2 border-black bg-blue-500 px-2 font-bold text-white disabled:brightness-50"
			disabled={selectedImagesIds.size == 0}
			onclick={onShareClick}
		>
			🔗 Share selected images ({selectedImagesIds.size})
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
