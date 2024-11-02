import { getUserShares } from '$lib/server/db/queries';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	return {
		user: event.locals.user,
		shares: await getUserShares(event.locals.user.id)
	};
}) satisfies PageServerLoad;
