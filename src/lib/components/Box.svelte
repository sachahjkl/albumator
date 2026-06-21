<script lang="ts">
	import type { Snippet } from 'svelte';

	interface BoxProps {
		classname?: string;
		children?: Snippet;
		mode?: 'regular' | 'rainbow';
	}
	const { children, classname, mode = 'regular' }: BoxProps = $props();

	let modeClasses = $derived.by(() => {
		if (mode === 'rainbow') {
			return 'rainbow-box border-transparent';
		}
		if (mode === 'regular') {
			return 'border-black';
		}
	});

	const bgColor = $derived(classname ? '' : 'bg-white');
</script>

<article class=" {classname} {bgColor} fat-shadow border-2 p-4 {modeClasses}">
	{#if children}
		{@render children()}
	{/if}
</article>

<style>
	@keyframes spin {
		to {
			--bg-angle: 360deg;
		}
	}

	.rainbow-box {
		animation: spin 2.5s infinite linear;
		will-change: background;
		background:
			linear-gradient(to bottom, white, white) padding-box,
			conic-gradient(from var(--bg-angle) in oklch longer hue, oklch(0.85 0.37 0) 0 0) border-box;
	}
</style>
