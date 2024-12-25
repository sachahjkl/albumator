import { db } from '$lib/server/db';
import { getShare, getUserShares } from '$lib/server/db/queries';
import * as table from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
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
		let id = shareId.toString();
		const share = await getShare(id);

		if (!share) {
			return fail(400, { message: 'Share not found' });
		}

		if (share.userId !== event.locals.user.id) {
			return fail(400, { message: 'You do not own this share' });
		}

		await db.delete(table.share).where(eq(table.share.id, id));

		return { message: 'Share deleted successfully' };
	}
};
