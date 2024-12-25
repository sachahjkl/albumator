<script lang="ts">
	import { enhance } from '$app/forms';
	import BlockButton from '$lib/components/BlockButton.svelte';
	import Box from '$lib/components/Box.svelte';
	import { APP_NAME } from '$lib/constants';
	import LoadingDots from '$lib/icons/LoadingDots.svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { SvelteMap } from 'svelte/reactivity';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let isDeletingMap = $state(new SvelteMap<string, boolean>());

	const onDeleteClick = (shareId: string): SubmitFunction => {
		return () => {
			isDeletingMap.set(shareId, true);
			return async ({ update }) => {
				isDeletingMap.set(shareId, false);
				await update();
			};
		};
	};
</script>

<svelte:head>
	<title>{APP_NAME} / Your Shares</title>
</svelte:head>

<Box classname="">
	<h1 class="mb-4 text-xl font-bold">
		🔗 {data.shares.length} Share{data.shares.length > 1 ? 's' : ''}
	</h1>
	<dl>
		{#each data.shares as share}
			<div
				class:border-red-500={share.expired}
				class="inset-shadow mb-2 border-l-4 border-neutral-800 bg-neutral-50 px-4 py-2"
			>
				<!-- TODO: add delete/edit buttons -->
				<dt class="mb-4 text-lg font-bold">
					{#if share.expired}
						<span class="text-red-500">"{share.title}" (expired)</span>
					{:else}
						<a class="text-blue-500 underline visited:text-purple-500" href="/shares/{share.id}">
							"{share.title}"
						</a>
					{/if}
				</dt>
				<dd>
					<p>Created at {new Date(share.createdAt).toLocaleString()}</p>
					{#if share.expiresAt}
						<p class:text-red-500={share.expired}>
							Expires at {new Date(share.expiresAt).toLocaleString()}
						</p>
					{:else}
						<p>Never expires</p>
					{/if}
					<p>Image count: {share.imagesCount}</p>
				</dd>

				<form
					class="mt-2"
					action="?/deleteShare"
					method="POST"
					use:enhance={onDeleteClick(share.id)}
					inert={isDeletingMap.get(share.id)}
				>
					<input class="hidden" type="text" name="share-id" id="share-id" value={share.id} />
					<BlockButton
						type="submit"
						classname="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white"
					>
						{#if isDeletingMap.get(share.id)}
							Deleting
							<LoadingDots classname="inline-block fill-white" />
						{:else}
							Delete
						{/if}
					</BlockButton>
				</form>
			</div>
		{:else}
			<p>
				You have no shares yet, you can create one by clicking on the "Share selected images" of the
				<a href="/home" class="underline">home page.</a> 
			</p>
		{/each}
	</dl>
</Box>
