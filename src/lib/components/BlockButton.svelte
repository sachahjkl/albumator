<script lang="ts">
	import type { Snippet } from 'svelte';

	type BlockButtonProps = {
		classname?: string;
		children?: Snippet;
		disabled?: boolean;
		text?: string;
		type?: 'submit' | 'reset' | 'button';
		onclick?: (e: Event) => void;
		[key: string]: unknown;
	};

	let {
		classname = '',
		text = 'Default Text',
		type = 'button',
		disabled = false,
		children,
		onclick,
		...rest
	}: BlockButtonProps = $props();
</script>

<button
	class="fat-shadow flex-[200px] border-2 border-black px-2 font-bold text-sharp {classname}"
	class:brightness-50={disabled}
	{disabled}
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
