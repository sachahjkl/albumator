import { GUEST_INFINITE_SCROLL_PAGE_SIZE } from '$lib/constants';
import { getShareWithImages } from '$lib/server/db/queries';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	const shareId = event.params.id;

	if (!shareId) {
		error(400, 'Share ID missing');
	}

	const share = await getShareWithImages(shareId, 1, GUEST_INFINITE_SCROLL_PAGE_SIZE);

	if (!share) {
		error(404, 'Share not found');
	}

	return {
		share,
		isExpired: !!share.expiresAt && share.expiresAt < new Date()
	};
}) satisfies PageServerLoad;
