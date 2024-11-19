import { getUserShares } from '$lib/server/db/queries';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

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
