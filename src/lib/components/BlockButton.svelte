<script lang="ts">
	import type { Snippet } from 'svelte';

	type BlockButtonProps = {
		classname?: string;
		children?: Snippet;
		text?: string;
		type?: 'submit' | 'reset' | 'button';
		onclick?: (e: Event) => void;
		rest?: unknown[];
	};

	let {
		classname = '',
		text = 'Default Text',
		type = 'button',
		children,
		onclick,
		...rest
	}: BlockButtonProps = $props();
</script>

<button
	class="fat-shadow flex-[200px] border-2 border-black px-2 font-bold {classname}"
	{onclick}
	{type}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else if text}
		{text}
	{/if}
</button>
