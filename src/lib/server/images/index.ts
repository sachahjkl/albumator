import { THUMBHASH_MAX_DIMENSION } from '$lib/constants';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import sharp from 'sharp';
import { rgbaToThumbHash } from 'thumbhash';

type ImageOutputFormat = 'avif' | 'gif' | 'jpeg' | 'png' | 'webp';

export type DerivedImageData = {
	width: number;
	height: number;
	thumbHash: string;
};

export type ResizedImage = {
	buffer: Buffer;
	cacheKey: string;
	contentType: string;
	width: number;
	height: number;
};

const formatsByMimeType = new Map<string, ImageOutputFormat>([
	['image/jpeg', 'jpeg'],
	['image/png', 'png'],
	['image/webp', 'webp'],
	['image/avif', 'avif'],
	['image/gif', 'gif'],
	['image/apng', 'png']
]);

export function getImageVariantFormat(acceptHeader: string | null, mimeType: string) {
	if (acceptHeader?.includes('image/avif')) {
		return { format: 'avif' as const, contentType: 'image/avif' };
	}

	if (acceptHeader?.includes('image/webp')) {
		return { format: 'webp' as const, contentType: 'image/webp' };
	}

	if (mimeType === 'image/png' || mimeType === 'image/apng') {
		return { format: 'png' as const, contentType: 'image/png' };
	}

	return { format: 'jpeg' as const, contentType: 'image/jpeg' };
}

export async function deriveImageData(blob: Buffer) {
	const normalized = sharp(blob, { animated: false, failOn: 'error' }).rotate();
	const metadata = await normalized.metadata();

	if (!metadata.width || !metadata.height) {
		throw new Error('Unable to read image dimensions');
	}

	const thumbInput = await normalized
		.ensureAlpha()
		.resize({
			width: THUMBHASH_MAX_DIMENSION,
			height: THUMBHASH_MAX_DIMENSION,
			fit: 'inside',
			withoutEnlargement: true
		})
		.raw()
		.toBuffer({ resolveWithObject: true });

	let thumbHash = rgbaToThumbHash(
		thumbInput.info.width,
		thumbInput.info.height,
		new Uint8Array(thumbInput.data)
	);

	return {
		width: metadata.width,
		height: metadata.height,
		thumbHash: Buffer.from(thumbHash).toString('base64')
	} satisfies DerivedImageData;
}

export async function resizeImageVariant({
	blob,
	mimeType,
	imageId,
	width,
	acceptHeader
}: {
	blob: Buffer;
	mimeType: string;
	imageId: string;
	width: number;
	acceptHeader: string | null;
}) {
	const { format, contentType } = getImageVariantFormat(acceptHeader, mimeType);
	const cacheKey = `${imageId}-${width}.${format}`;
	const pipeline = sharp(blob, { animated: false, failOn: 'error' }).rotate().resize({
		width,
		fit: 'inside',
		withoutEnlargement: true
	});

	const formatted =
		format === 'avif'
			? pipeline.avif({ quality: 65, effort: 4 })
			: format === 'webp'
				? pipeline.webp({ quality: 75 })
				: format === 'png'
					? pipeline.png()
					: pipeline.jpeg({ quality: 80, mozjpeg: true });

	const result = await formatted.toBuffer({ resolveWithObject: true });

	return {
		buffer: result.data,
		cacheKey,
		contentType,
		width: result.info.width,
		height: result.info.height
	} satisfies ResizedImage;
}

export function createImageEtag(buffer: Buffer) {
	return `"${createHash('sha1').update(buffer).digest('hex')}"`;
}

export function createOriginalImageEtag({
	id,
	width,
	height,
	mimeType,
	createdAt
}: {
	id: string;
	width: number;
	height: number;
	mimeType: string;
	createdAt: Date;
}) {
	return `"${createHash('sha1')
		.update(`${id}:${width}:${height}:${mimeType}:${createdAt.toISOString()}`)
		.digest('hex')}"`;
}

export function createCacheKeyEtag(cacheKey: string) {
	return `"${createHash('sha1').update(cacheKey).digest('hex')}"`;
}

export function streamBufferResponse(buffer: Buffer) {
	return Readable.toWeb(Readable.from(buffer)) as ReadableStream;
}

export function getOriginalFormat(mimeType: string) {
	return formatsByMimeType.get(mimeType) ?? 'jpeg';
}

export {
	beginImageCacheLease,
	createImageVariantCacheKey,
	deduplicateCacheGeneration,
	readCachedImageVariant,
	writeCachedImageVariant
} from './cache';
export type { ImageCacheLease } from './cache';
