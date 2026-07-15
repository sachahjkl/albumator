import { getSharedImageBuffer, getUserImageBuffer } from '$lib/server/db/queries';
import {
	beginImageCacheLease,
	createCacheKeyEtag,
	createImageVariantCacheKey,
	createOriginalImageEtag,
	deduplicateCacheGeneration,
	getImageVariantFormat,
	readCachedImageVariant,
	resizeImageVariant,
	streamBufferResponse,
	writeCachedImageVariant
} from '$lib/server/images';
import type { Image } from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const cacheControl = 'private, no-store';
	const imageId = event.params.id;
	const cacheLease = beginImageCacheLease(imageId);

	try {
		const maybeShareId = event.url.searchParams.get('shareId');
		const requestedWidthParam = event.url.searchParams.get('w');
		const requestedWidth = requestedWidthParam
			? z.enum(['32', '64', '128', '256', '512', '1024', '2048']).parse(requestedWidthParam)
			: null;

		let attachment: Image | undefined;
		if (maybeShareId) {
			const image = await getSharedImageBuffer(maybeShareId, imageId);
			if (!image) {
				error(404, 'Image not found in share');
			}
			attachment = image;
		}

		if (!attachment) {
			if (!event.locals.user) {
				error(401, 'Unauthorized');
			}
			attachment = await getUserImageBuffer(event.locals.user.id, imageId);
		}

		if (!attachment) {
			error(404, 'Image not found');
		}

		if (!requestedWidth) {
			const etag = createOriginalImageEtag(attachment);

			if (event.request.headers.get('if-none-match') === etag) {
				return new Response(null, { status: 304, headers: { 'Cache-Control': cacheControl } });
			}

			event.setHeaders({
				'Content-Type': attachment.mimeType,
				'Content-Length': attachment.blob.byteLength.toString(),
				'Cache-Control': cacheControl,
				ETag: etag
			});

			return new Response(streamBufferResponse(attachment.blob));
		}

		const desiredVariant = getImageVariantFormat(
			event.request.headers.get('accept'),
			attachment.mimeType
		);
		const cacheKey = createImageVariantCacheKey(imageId, requestedWidth, desiredVariant.format);
		const variant = await readCachedImageVariant(cacheKey);

		if (variant) {
			const etag = createCacheKeyEtag(cacheKey);

			if (event.request.headers.get('if-none-match') === etag) {
				return new Response(null, {
					status: 304,
					headers: { 'Cache-Control': cacheControl, Vary: 'Accept' }
				});
			}

			event.setHeaders({
				'Content-Type': desiredVariant.contentType,
				'Content-Length': variant.buffer.byteLength.toString(),
				'Cache-Control': cacheControl,
				ETag: etag,
				Vary: 'Accept'
			});

			return new Response(streamBufferResponse(variant.buffer));
		}

		const resized = await deduplicateCacheGeneration(cacheKey, async () => {
			const cached = await readCachedImageVariant(cacheKey);
			if (cached) {
				return {
					buffer: cached.buffer,
					cacheKey,
					contentType: desiredVariant.contentType
				};
			}

			const generated = await resizeImageVariant({
				blob: attachment.blob,
				mimeType: attachment.mimeType,
				imageId,
				width: Number(requestedWidth),
				acceptHeader: event.request.headers.get('accept')
			});
			await writeCachedImageVariant(cacheKey, generated.buffer, cacheLease);
			return { ...generated, cacheKey };
		});

		const etag = createCacheKeyEtag(resized.cacheKey);
		if (event.request.headers.get('if-none-match') === etag) {
			return new Response(null, {
				status: 304,
				headers: { 'Cache-Control': cacheControl, Vary: 'Accept' }
			});
		}

		event.setHeaders({
			'Content-Type': resized.contentType,
			'Content-Length': resized.buffer.byteLength.toString(),
			'Cache-Control': cacheControl,
			ETag: etag,
			Vary: 'Accept'
		});

		return new Response(streamBufferResponse(resized.buffer));
	} finally {
		cacheLease.release();
	}
};
