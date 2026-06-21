<script lang="ts">
	import { page } from '$app/state';
	import Box from '$lib/components/Box.svelte';
</script>

{#snippet errorName()}
	{#if page.status === 410}
		Resource expired
	{:else if page.status === 404}
		Page not found
	{:else}
		An error occured
	{/if}
{/snippet}

<Box classname="border-red-900 bg-red-500 font-bold text-white">
	<hgroup class="mb-4 flex flex-col gap-2">
		<h1 class="text-xl font-bold">{@render errorName()}</h1>

		<h2 class="text-sm text-red-200 italic">
			(HTTP code = {page.status})
		</h2>
	</hgroup>

	<div class="mb-2 space-y-2 text-sm text-red-100">
		{#if page.error}
			<p>
				Reason: {page.error.message}
			</p>
		{/if}
		<p>
			← <a href="/" class="underline"> Go back home</a>
		</p>
	</div>
</Box>
