<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import { APP_NAME } from '$lib/constants';
	import { imageWithUrl } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let images = $derived(data.share?.images.map((i) => i.image).map(imageWithUrl));
</script>

<svelte:head>
	<title>{APP_NAME} / Share "{data.share?.title}""</title>
</svelte:head>

<Header mode="guest" />

<div class="my-2">
	<h1 class="mb-4 text-xl font-bold"># Share "{data.share?.title}"</h1>

	<ImageGrid defaultSize={250} images={images ?? []} enableSelectable={false} />
</div>
