import { getSharedImageBuffer, getUserImageBuffer } from '$lib/server/db/queries';
import type { Image } from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const imageId = event.params.id;
	const maybeShareId = event.url.searchParams.get('shareId');

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
	event.setHeaders({
		'Content-Type': attachment.mimeType,
		'Content-Length': attachment.blob.byteLength.toString(),
		'Cache-Control': 'public, max-age=31536000'
	});

	return new Response(attachment.blob);
};
