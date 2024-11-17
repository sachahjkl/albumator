import { deleteImages } from '$lib/server/db/queries';
import { error, text } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async (event) => {
	if (!event.locals.user) {
		error(401, 'Unauthorized');
	}

	const payload = await event.request.json();

	let imageIds = z.array(z.string()).safeParse(payload);

	if (imageIds.success === false) {
		error(400, 'Invalid image ids');
	}

	const res = await deleteImages(event.locals.user.id, imageIds.data);

	return text(`${res.rowsAffected} images deleted`);
};
