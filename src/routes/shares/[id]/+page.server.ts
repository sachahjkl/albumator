import { getShare } from '$lib/server/db/queries';
import { error } from 'console';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	const shareId = event.params.id;

	if (!shareId) {
		return error('Share ID missing');
	}

	const share = await getShare(shareId);

	if (!share) {
		return error('Share not found');
	}
	if (share.expiresAt && share.expiresAt < new Date()) {
		return error('Share expired');
	}

	return {
		share
	};
}) satisfies PageServerLoad;
