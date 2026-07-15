<script lang="ts">
	import {
		getPreferredResponsiveImageWidth,
		getResponsiveImageSrcSet,
		getResponsiveImageUrl
	} from '$lib/mappers';
	import { thumbHashToDataURL } from 'thumbhash';

	type ResponsiveImageProps = {
		id: string;
		name: string;
		width: number;
		height: number;
		thumbHash: string;
		displayWidth: number;
		sizes?: string;
		shareId?: string;
		loading?: 'lazy' | 'eager';
		imageClass?: string;
		onImageElement?: (imageElement: HTMLImageElement | undefined) => void;
		fit?: 'cover' | 'contain';
		containerClass?: string;
		maxWidth?: number;
	};

	let {
		id,
		name,
		width,
		height,
		thumbHash,
		displayWidth,
		sizes: sizesProp,
		shareId,
		loading = 'lazy',
		imageClass = '',
		onImageElement,
		fit = 'cover',
		containerClass = '',
		maxWidth = 2048
	}: ResponsiveImageProps = $props();

	let loaded = $state(false);
	let imageElement = $state<HTMLImageElement>();

	const decodeBase64 = (value: string) => {
		if (!value) {
			return new Uint8Array();
		}

		if (typeof Buffer !== 'undefined') {
			return new Uint8Array(Buffer.from(value, 'base64'));
		}

		return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
	};

	let placeholderUrl = $derived(
		thumbHash
			? thumbHashToDataURL(decodeBase64(thumbHash))
			: 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
	);
	let fallbackWidth = $derived(getPreferredResponsiveImageWidth(width, displayWidth));
	let src = $derived(getResponsiveImageUrl(id, fallbackWidth, shareId));
	let srcset = $derived(getResponsiveImageSrcSet(id, width, shareId, maxWidth));
	let sizes = $derived(sizesProp ?? `${displayWidth}px`);

	$effect(() => {
		onImageElement?.(imageElement);
	});
</script>

<div class="relative h-full w-full overflow-hidden bg-white {containerClass}">
	<img
		class="absolute inset-0 h-full w-full transition-opacity duration-200 {fit === 'contain'
			? 'object-contain'
			: 'object-cover'} {loaded ? 'opacity-0' : 'opacity-100'}"
		src={placeholderUrl}
		alt=""
		aria-hidden="true"
		draggable="false"
	/>
	<img
		class="absolute inset-0 h-full w-full transition-opacity duration-200 {fit === 'contain'
			? 'object-contain'
			: 'object-cover'} {imageClass} {loaded ? 'opacity-100' : 'opacity-0'}"
		{src}
		{srcset}
		{sizes}
		alt={name}
		{loading}
		decoding="async"
		draggable="false"
		onload={() => {
			loaded = true;
		}}
		bind:this={imageElement}
	/>
</div>
