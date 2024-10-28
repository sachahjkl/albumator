<script lang="ts">
	type LightboxProps = {
		images: { id: string; title: string; url: string }[];
		selectedId?: string;
		status: 'open' | 'closed';
	};

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			status = 'closed';
		}
		if (e.key === 'ArrowLeft') {
			previous(e);
		}
		if (e.key === 'ArrowRight') {
			next(e);
		}
	};

	let { status = $bindable(), selectedId, images }: LightboxProps = $props();

	let current = $derived(images.find((image) => image.id === selectedId));

	const previous = (e: Event) => {
		e.stopPropagation();
		if (selectedId) {
			const index = images.findIndex((image) => image.id === selectedId);
			const newIndex = index - 1 < 0 ? images.length - 1 : index - 1;
			selectedId = images[newIndex].id;
		}
	};

	const next = (e: Event) => {
		e.stopPropagation();
		if (selectedId) {
			const index = images.findIndex((image) => image.id === selectedId);
			const newIndex = index + 1 > images.length - 1 ? 0 : index + 1;
			selectedId = images[newIndex].id;
		}
	};
</script>

{#snippet buttonNav(text: string, action: (...args: any[]) => void, classes = '')}
	<button
		class="{classes} fat-shadow inline-block whitespace-nowrap break-keep border-2 border-black bg-white px-2"
		onclick={action}>{text}</button
	>
{/snippet}

<svelte:window on:keydown={handleKeydown} />
{#if status === 'open'}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		id="lightbox"
		onclick={() => (status = 'closed')}
		onkeydown={handleKeydown}
		role="dialog"
		class="fixed inset-0 z-50 bg-black bg-opacity-15 backdrop-blur-md"
	>
		<div class="flex h-full w-full items-center justify-around px-4">
			<div class="fat-shadow my-4 block border-2 border-black bg-white p-4">
				{#each images as image}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<img
						onclick={(e) => e.stopPropagation()}
						class="max-h-[750px] object-cover"
						src={image.url}
						alt={image.title}
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
					class="fat-shadow my-2 flex items-center justify-center gap-2 border-2 border-black bg-white py-2"
				>
					"<span title={current?.title} class="inline max-w-[20ch] truncate">{current?.title}</span
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
