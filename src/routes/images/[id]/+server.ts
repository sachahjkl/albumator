import { getUserImageBuffer } from '$lib/server/db/queries';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) {
		error(401, 'Unauthorized');
	}

	const imageId = event.params.id;
	const attachment = await getUserImageBuffer(event.locals.user.id, imageId);

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
