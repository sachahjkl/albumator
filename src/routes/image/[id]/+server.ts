import { getUserImageBuffer } from '$lib/server/db/queries';
import { fail } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) {
		throw fail(401, { message: 'Unauthorized' });
	}

	const imageId = event.params.id;
	const attachment = await getUserImageBuffer(event.locals.user.id, imageId);

	if (!attachment) {
		throw fail(404, { message: 'Image not found' });
	}
	event.setHeaders({
		'Content-Type': attachment.mimeType,
		'Content-Length': attachment.blob.byteLength.toString()
	});

	return new Response(attachment.blob);
};
