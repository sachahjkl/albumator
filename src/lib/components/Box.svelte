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
</script>

<article class="fat-shadow border-2 bg-white p-4 {classname} {modeClasses}">
	{#if children}
		{@render children()}
	{/if}
</article>

<style>
	/* Rainbow border effect, stolen from https://codepen.io/jlengstorf/pen/WNPGMJo */
	@property --bg-angle {
		inherits: false;
		initial-value: 0deg;
		syntax: '<angle>';
	}

	/**
 * To animate the gradient, we set the custom property to 1 full
 * rotation. The animation starts at the default value of `0deg`.
 */
	@keyframes spin {
		to {
			--bg-angle: 360deg;
		}
	}

	.rainbow-box {
		animation: spin 2.5s infinite linear;
		will-change: background;
		background:
    /* Background colors don’t work with `background-origin`, so use a gradient. */
			linear-gradient(to bottom, white, white) padding-box,
			/* ends at inner border edges */
				conic-gradient(from var(--bg-angle) in oklch longer hue, oklch(0.85 0.37 0) 0 0) border-box; /* extends to outer border edges */

		/* a clear border lets the background gradient shine through */
	}
</style>
