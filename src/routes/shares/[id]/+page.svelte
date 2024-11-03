<script lang="ts">
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import { APP_NAME } from '$lib/constants';
	import { imageWithSharedUrl } from '$lib/mappers';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let images = $derived(
		data.share?.images.map((i) => i.image).map(imageWithSharedUrl(data.share.id))
	);
</script>

<svelte:head>
	<title>{APP_NAME} / Share "{data.share?.title}""</title>
</svelte:head>

<div class="my-2">
	<h1 class="my-4 text-xl font-bold"># Share "{data.share?.title}"</h1>

	<ImageGrid defaultSize={250} images={images ?? []} enableSelectable={false} />
</div>
