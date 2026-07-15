import { deleteShare, getUserShares } from '$lib/server/db/queries';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load = (async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/');
	}

	const shares = await getUserShares(event.locals.user.id);

	return {
		user: event.locals.user,
		shares: shares.map((share) => ({
			expired: share.expiresAt && share.expiresAt < new Date(),
			...share
		}))
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	deleteShare: async (event) => {
		if (!event.locals.user) {
			return fail(401);
		}

		const formData = await event.request.formData();

		const shareId = formData.get('share-id');

		if (!shareId) {
			return fail(400, { message: 'Share ID is required' });
		}
		const id = shareId.toString();
		const result = await deleteShare(id, event.locals.user.id);
		if (result.rowsAffected === 0) {
			return fail(404, { message: 'Share not found' });
		}

		return { message: 'Share deleted successfully' };
	}
};
