<script lang="ts">
	import { APP_NAME } from '$lib/constants';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{APP_NAME} / Your Shares</title>
</svelte:head>

<div class="my-2">
	<h1 class="my-4 text-xl font-bold"># {data.shares.length} Share{data.shares.length > 1 ? 's' : ''}</h1>
	<dl>
		{#each data.shares as share}
			<div class="fat-shadow border-2 border-l-4 border-neutral-800 bg-white px-4 py-2 mb-2">
				<!-- TODO: add delete/edit buttons -->
				<dt class="mb-4 text-lg font-bold text-blue-500 underline visited:text-purple-500">
					<a href="/shares/{share.id}">
						"{share.title}"
					</a>
				</dt>
				<dd>
					<p>Created at {new Date(share.createdAt).toLocaleString()}</p>
					{#if share.expiresAt}
						<p>Expires at {new Date(share.expiresAt).toLocaleString()}</p>
					{/if}
					<p>Image count: {share.imagesCount}</p>
				</dd>
			</div>
		{/each}
	</dl>
</div>
