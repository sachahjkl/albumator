<script lang="ts">
	type LightboxProps = {
		images: { id: string; name: string; url: string }[];
		startId?: string;
		displayState: 'open' | 'closed';
	};

	let {
		displayState: status = $bindable(),
		startId: selectedId,
		images
	}: LightboxProps = $props();

	let exitClickBox = $state<HTMLElement>(); 

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			status = 'closed';
		}
		if (e.key === 'ArrowLeft') {
			previous();
		}
		if (e.key === 'ArrowRight') {
			next();
		}
	};

	const handleScroll = (e: WheelEvent) => {
		if (e.ctrlKey) return;
		if (e.deltaY > 0) {
			next();
		} else if (e.deltaY < 0) {
			previous();
		}
	};

	let current = $derived(images.find((image) => image.id === selectedId));

	const previous = () => {
		if (selectedId) {
			const index = images.findIndex((image) => image.id === selectedId);
			const newIndex = index - 1 < 0 ? images.length - 1 : index - 1;
			selectedId = images[newIndex].id;
		}
	};

	$effect(() => {
		if (status === 'open') {
			document.body.style.overflow = 'hidden';
		}
		if (status === 'closed') {
			document.body.style.overflow = '';
		}
	});

	const next = () => {
		if (selectedId) {
			const index = images.findIndex((image) => image.id === selectedId);
			const newIndex = index + 1 > images.length - 1 ? 0 : index + 1;
			selectedId = images[newIndex].id;
		}
	};

	const onBackgroundClick = (e: Event) => {
		if (e.target === exitClickBox) {
			status = 'closed';
		}
	};
</script>

{#snippet buttonNav(text: string, action: (...args: any[]) => void, classes = '')}
	<button
		class="{classes} fat-shadow inline-block whitespace-nowrap break-keep border-2 border-black bg-white px-2"
		onclick={action}>{text}</button
	>
{/snippet}

<svelte:window onkeydown={handleKeydown} onwheel={handleScroll} />
{#if status === 'open'}
	<div id="lightbox" class="fixed inset-0 z-50 bg-black bg-opacity-15 backdrop-blur-md">
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			bind:this={exitClickBox}
			onkeydown={handleKeydown}
			onclick={onBackgroundClick}
			role="dialog"
			class="flex h-full w-full items-center justify-around px-4"
		>
			<div class="fat-shadow my-4 mb-20 block border-2 border-black bg-white p-4">
				{#each images as image}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<img
						style="--max-h: min(750px, 80vh)"
						class="max-h-[--max-h] object-cover"
						src={image.url}
						alt={image.name}
						class:selected={image.id === selectedId}
					/>
				{/each}
			</div>
		</div>

		<footer class="fixed bottom-0 left-0 right-0">
			<div class="px-4">
				<div id="toolbar" class="flex items-center justify-between gap-2">
					<button
						onclick={() => (status = 'closed')}
						class=" fat-shadow inline-block border-2 border-black bg-red-500 px-2 font-bold text-white hover:bg-red-700"
					>
						Close
					</button>
					<div class="inline-flex items-center justify-between gap-3">
						{@render buttonNav('<- Prev', previous)}
						{@render buttonNav('Next ->', next)}
					</div>
				</div>
				<div
					class="fat-shadow my-2 flex flex-wrap items-center justify-center gap-2 border-2 border-black bg-white px-4 py-2"
				>
					"<span title={current?.name} class="m-0 inline-block max-w-[20ch] truncate"
						>{current?.name}</span
					>" - Picture {images.findIndex((image) => image.id === selectedId) + 1} of {images.length}
				</div>
			</div>
		</footer>
	</div>
{/if}

<style>
	.selected {
		display: block;
	}
	img {
		display: none;
	}
</style>
