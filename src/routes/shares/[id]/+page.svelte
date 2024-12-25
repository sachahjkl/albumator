<script lang="ts">
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import { APP_NAME } from '$lib/constants';
	import { imageWithSharedUrl } from '$lib/mappers';
	import { daysBetween } from '$lib/utils';
	import { SvelteSet } from 'svelte/reactivity';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Image = (typeof images)[number];

	let initialImages = $state(data.share.images);
	let images = $derived(initialImages.map(imageWithSharedUrl(data.share.id)));
	let imageIdSet = $derived(new SvelteSet(initialImages.map((i) => i.id)));

	let currentPage = $state(1);
	const loadNextPage = async () => {
		currentPage++;
		let reachedEnd = await fetch('/shares/' + data.share.id + '?page=' + currentPage, {
			headers: {
				'Content-Type': 'application/json'
			}
		})
			.then((r) => r.json())
			.then((images: Image[]) => {
				const newImages = images.filter((image) => !imageIdSet.has(image.id));
				initialImages.push(...newImages.map(imageWithSharedUrl(data.share.id)));
				return newImages.length > 0;
			});
		return { reachedEnd };
	};
</script>

<svelte:head>
	<title>{APP_NAME} / Share "{data.share?.title}""</title>
</svelte:head>

<h1 class="my-4 text-xl font-bold">Share "{data.share?.title}"</h1>
<div class="my-2">
	{#if data.isExpired == false}
		<ImageGrid
			images={images ?? []}
			enableSelectable={false}
			initialFilter={data.initialFilter}
			onNextPageNeeded={loadNextPage}
		/>
	{:else}
		{@const expiredDate = new Date(data.share.expiresAt ?? 0)}
		{@const days = daysBetween(expiredDate, new Date())}

		<p class="text-red-500">
			Unfortunately (for you), this share expired on {expiredDate.toLocaleString()}, you're {days} day{days ===
			1
				? ''
				: 's'} late 😂😂 
		</p>
	{/if}
</div>
