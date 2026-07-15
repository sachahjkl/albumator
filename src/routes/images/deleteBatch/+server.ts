import { deleteImages } from '$lib/server/db/queries';
import { invalidateImageVariants } from '$lib/server/images/cache';
import { error, text } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async (event) => {
	if (!event.locals.user) {
		error(401, 'Unauthorized');
	}

	const payload = await event.request.json();

	let imageIds = z.array(z.string().min(1).max(128)).min(1).max(500).safeParse(payload);

	if (imageIds.success === false) {
		error(400, 'Invalid image ids');
	}

	const ids = [...new Set(imageIds.data)];
	const deletedImages = await deleteImages(event.locals.user.id, ids);
	await Promise.all(
		deletedImages.map(({ id }) =>
			invalidateImageVariants(id).catch((cacheError) =>
				console.error(`Unable to invalidate image cache for ${id}`, cacheError)
			)
		)
	);

	return text(`${deletedImages.length} images deleted`);
};
