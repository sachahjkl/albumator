<script lang="ts">
	import type { Snippet } from 'svelte';
	import { copy } from 'svelte-copy';

	type CopyableProps = {
		value: string;
		status?: 'copied' | 'pending';
		copied?: Snippet;
		pending?: Snippet<[string]>;
	};

	let { value, status = $bindable('pending'), copied, pending }: CopyableProps = $props();
</script>

<button
	type="button"
	use:copy={{
		text: value,
		onCopy: () => {
			status = 'copied';
		}
	}}
	class="fat-shadow inline-block border-2 border-dotted border-black p-2"
>
	{#if status === 'copied'}
		{#if copied}
			{@render copied()}
		{:else}
			Value was copied to your clipboard
		{/if}
	{/if}

	{#if status === 'pending'}
		{#if pending}
			{@render pending(value)}
		{:else}
			{value} (Click to copy)
		{/if}
	{/if}
</button>
