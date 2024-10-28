import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { image } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
	const imageId = event.params.id;
	const attachment = await db.query.image.findFirst({
		where: eq(image.id, imageId)
	});

	if (!attachment) {
		throw fail(404, { message: 'Image not found' });
	}
	event.setHeaders({
		'Content-Type': attachment.mimeType,
		'Content-Length': attachment.blob.byteLength.toString()
	});

	return new Response(attachment.blob);
};
