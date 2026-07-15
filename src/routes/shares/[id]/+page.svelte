<script lang="ts">
	import ImageGrid from '$lib/components/ImageGrid.svelte';
	import { APP_NAME } from '$lib/constants';
	import { imageWithSharedUrl } from '$lib/mappers';
	import { daysBetween } from '$lib/utils';
	import { untrack } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type Image = (typeof images)[number];

	let initialImages = $state(untrack(() => [...data.share.images]));
	let images = $derived(initialImages.map(imageWithSharedUrl(data.share.id)));
	let imageIdSet = $derived(new SvelteSet(initialImages.map((i) => i.id)));

	let currentPage = $state(1);
	const loadNextPage = async () => {
		const nextPage = currentPage + 1;
		const response = await fetch('/shares/' + data.share.id + '?page=' + nextPage, {
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			throw new Error('Unable to load more images');
		}

		const pageImages: Image[] = await response.json();
		const newImages = pageImages.filter((image) => !imageIdSet.has(image.id));
		initialImages.push(...newImages.map(imageWithSharedUrl(data.share.id)));
		currentPage = nextPage;
		return { hasMore: pageImages.length > 0 };
	};
</script>

<svelte:head>
	<title>{APP_NAME} / Share "{data.share?.title}"</title>
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
