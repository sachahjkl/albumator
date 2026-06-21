<script lang="ts">
	import { getLargestResponsiveImageWidth, getResponsiveImageUrl } from '$lib/mappers';

	type LightboxProps = {
		images: { id: string; name: string; url: string; width?: number; shareId?: string }[];
		firstId?: string;
		open?: 'open' | string;
	};

	let { open = $bindable(), firstId: selectedId, images }: LightboxProps = $props();

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			open = '';
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

	const handleSideClick = (e: MouseEvent) => {
		if (!(e.target instanceof HTMLElement)) {
			return;
		}

		if (!e?.target?.offsetWidth) {
			return;
		}

		const centerX = e.target.offsetWidth / 2;
		if (e.x < centerX) {
			previous();
		} else {
			next();
		}
	};

	let current = $derived(images.find((image) => image.id === selectedId));
	let currentUrl = $derived(
		current?.width
			? getResponsiveImageUrl(
					current.id,
					getLargestResponsiveImageWidth(current.width, 2048),
					current.shareId
				)
			: current?.url
	);

	const previous = () => {
		if (selectedId) {
			const index = images.findIndex((image) => image.id === selectedId);
			const newIndex = index - 1 < 0 ? images.length - 1 : index - 1;
			selectedId = images[newIndex].id;
		}
	};

	$effect(() => {
		if (open == 'open') {
			document.body.style.overflow = 'hidden';
		} else {
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
</script>

{#snippet buttonNav(text: string, action: (...args: any[]) => void, classes = '')}
	<button
		class="{classes} fat-shadow inline-block border-2 border-black bg-white px-2 break-keep whitespace-nowrap"
		onclick={action}>{text}</button
	>
{/snippet}

<svelte:window onkeydown={handleKeydown} onwheel={handleScroll} />
{#if open == 'open'}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		id="lightbox"
		onkeydown={handleKeydown}
		role="dialog"
		tabindex="-1"
		class="
			 justify-items-center-center bg-opacity-15 fixed inset-0 z-10 flex flex-col content-center gap-2 bg-black px-1 backdrop-blur-md"
	>
		<section id="lightbox-top" class="flex justify-end">
			<button onclick={() => (open = 'closed')} class="group inline-block p-2">
				<div
					class="fat-shadow border-2 border-black bg-red-500 px-2 font-bold text-white group-hover:bg-red-700"
				>
					Close
				</div>
			</button>
		</section>
		<button onclick={handleSideClick} class="flex flex-auto items-center justify-center">
			{#each images as image}
				{#if image.id === selectedId}
					<img
						class="fat-shadow block max-h-[80vh] max-w-full flex-auto border-2 border-black bg-white object-contain p-2"
						src={currentUrl}
						alt={image.name}
					/>
				{/if}
			{/each}
		</button>

		<section id="lightbox-toolbar" class="flex-shrink-0">
			<div id="lightbox-toolbar-buttons" class="flex items-center justify-end gap-3">
				{@render buttonNav('<- Prev', previous)}
				{@render buttonNav('Next ->', next)}
			</div>
			<div
				class="
					fat-shadow my-2 border-2 border-black bg-white px-4 py-2"
			>
				<p
					class="w-full overflow-hidden text-center text-nowrap text-ellipsis"
					title={`"${current?.name}" - Picture ${images.findIndex((image) => image.id === selectedId) + 1} of
					${images.length}`}
				>
					"{current?.name}" - Picture {images.findIndex((image) => image.id === selectedId) + 1} of
					{images.length}
				</p>
			</div>
		</section>
	</div>
{/if}
