<script lang="ts">
	import type { Snippet } from 'svelte';

	type ModalProps = {
		open?: boolean;
		style?: 'dimmed' | 'full';
		children?: Snippet;
	};

	let { open = $bindable(), children }: ModalProps = $props();

	let exitClickBox = $state<HTMLElement>();

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			open = false;
		}
	};

	$effect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		}
		if (open == false) {
			document.body.style.overflow = '';
		}
	});

	const onBackgroundClick = (e: Event) => {
		if (e.target === exitClickBox) {
			open = false;
		}
	};
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div id="modal" class="bg-opacity-15 fixed inset-0 z-10 bg-black backdrop-blur-md">
		{#if children}
			{@render children()}
		{/if}
	</div>
{/if}
