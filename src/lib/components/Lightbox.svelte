<script lang="ts">
	import ResponsiveImage from './ResponsiveImage.svelte';

	type LightboxProps = {
		images: {
			id: string;
			name: string;
			url: string;
			width: number;
			height: number;
			thumbHash: string;
			shareId?: string;
		}[];
		firstId?: string;
		open?: boolean;
	};

	let { open = $bindable(false), firstId, images }: LightboxProps = $props();

	let dialog = $state<HTMLDialogElement>();
	let closeButton = $state<HTMLButtonElement>();
	let selectedId = $state<string>();
	let returnFocus: HTMLElement | null = null;

	let currentIndex = $derived(images.findIndex((image) => image.id === selectedId));
	let current = $derived(currentIndex >= 0 ? images[currentIndex] : undefined);
	let hasDimensions = $derived(!!current && current.width > 0 && current.height > 0);

	const move = (offset: number) => {
		if (images.length < 2) return;

		const index = currentIndex >= 0 ? currentIndex : 0;
		selectedId = images[(index + offset + images.length) % images.length].id;
	};

	const previous = () => move(-1);
	const next = () => move(1);
	const handleSideClick = (event: MouseEvent) => {
		const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
		if (event.clientX < bounds.left + bounds.width / 2) {
			previous();
		} else {
			next();
		}
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			previous();
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			next();
		}
	};

	const requestClose = () => {
		open = false;
	};

	$effect(() => {
		if (!dialog) return;

		if (open && !dialog.open) {
			selectedId =
				firstId && images.some((image) => image.id === firstId) ? firstId : images[0]?.id;
			returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
			dialog.showModal();
			closeButton?.focus();
		} else if (!open && dialog.open) {
			dialog.close();
		}
	});

	$effect(() => {
		if (!open) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		return () => {
			document.body.style.overflow = previousOverflow;
		};
	});
</script>

<dialog
	bind:this={dialog}
	aria-labelledby="lightbox-title"
	aria-describedby="lightbox-status"
	onkeydown={handleKeydown}
	oncancel={() => (open = false)}
	onclose={() => {
		open = false;
		const target = returnFocus;
		returnFocus = null;
		queueMicrotask(() => {
			if (target?.isConnected) target.focus();
		});
	}}
	class="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-1 text-inherit"
>
	<div class="flex h-full flex-col gap-2">
		<h2 id="lightbox-title" class="sr-only">Image viewer</h2>
		<div class="flex justify-end">
			<button
				bind:this={closeButton}
				type="button"
				onclick={requestClose}
				class="fat-shadow border-2 border-black bg-red-500 px-4 py-2 font-bold text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
			>
				Close
			</button>
		</div>

		<button
			type="button"
			disabled={images.length < 2}
			onclick={handleSideClick}
			aria-label="Previous image on the left, next image on the right"
			class="flex min-h-0 w-full flex-auto items-center justify-center border-0 bg-transparent p-0 disabled:cursor-default"
		>
			{#if current}
				<div
					style:aspect-ratio={hasDimensions ? `${current.width} / ${current.height}` : '4 / 3'}
					style:width={hasDimensions
						? `min(100%, calc((100dvh - 10rem) * ${current.width / current.height}))`
						: 'min(100%, calc(100dvh - 10rem))'}
					class="fat-shadow max-h-full max-w-full border-2 border-black bg-white p-2"
				>
					{#key current.id}
						<ResponsiveImage
							id={current.id}
							name={current.name}
							width={current.width}
							height={current.height}
							thumbHash={current.thumbHash}
							displayWidth={Math.min(current.width, 2048)}
							sizes="100vw"
							shareId={current.shareId}
							loading="eager"
							fit="contain"
							maxWidth={2048}
						/>
					{/key}
				</div>
			{/if}
		</button>

		<div class="flex-shrink-0">
			<div class="flex items-center justify-end gap-3">
				<button
					type="button"
					disabled={images.length < 2}
					onclick={previous}
					class="fat-shadow inline-block border-2 border-black bg-white px-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
				>
					&lt;- Prev
				</button>
				<button
					type="button"
					disabled={images.length < 2}
					onclick={next}
					class="fat-shadow inline-block border-2 border-black bg-white px-2 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
				>
					Next -&gt;
				</button>
			</div>
			<div class="fat-shadow my-2 border-2 border-black bg-white px-4 py-2">
				<p
					id="lightbox-status"
					aria-live="polite"
					aria-atomic="true"
					class="w-full overflow-hidden text-center text-nowrap text-ellipsis"
				>
					"{current?.name}" - Picture {currentIndex + 1} of {images.length}
				</p>
			</div>
		</div>
	</div>
</dialog>

<style>
	dialog::backdrop {
		background: rgb(0 0 0 / 70%);
		backdrop-filter: blur(6px);
	}
</style>
