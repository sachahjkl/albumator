<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { APP_NAME } from '$lib/constants';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>{APP_NAME} / Home</title>
</svelte:head>

<Header username={data.user.username} userId={data.user.id} />

<div class="my-2">
	<h1 class="mb-4 text-xl font-bold"># Shares</h1>

	{#each data.shares as share}
		<div class="fat-shadow my-2 border-2 border-black px-4 py-2">
			<h2 class="mb-4 text-lg font-bold text-blue-500 underline visited:text-purple-500">
				<a href="/shares/{share.id}">
					# Share "{share.title}"
				</a>
			</h2>
			<p>Created at {new Date(share.createdAt).toLocaleString()}</p>
			{#if share.expiresAt}
				<p>Expires at {new Date(share.expiresAt).toLocaleString()}</p>
			{/if}
			<p>Image count: {share.imagesCount}</p>
		</div>
	{/each}
</div>
