<script lang="ts">
	import Box from '$lib/components/Box.svelte';
	import { APP_NAME } from '$lib/constants';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{APP_NAME} / Your Shares</title>
</svelte:head>

<Box classname="">
	<h1 class="mb-4 text-xl font-bold">
		{data.shares.length} Share{data.shares.length > 1 ? 's' : ''}
	</h1>
	<dl>
		{#each data.shares as share}
			<div
				class:border-red-500={share.expired}
				class="mb-2 border-l-4 border-neutral-800 bg-neutral-50 px-4 py-2 inset-shadow"
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
			</div>
		{/each}
	</dl>
</Box>
