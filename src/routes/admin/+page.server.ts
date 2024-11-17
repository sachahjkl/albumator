import { BIG_BOSS_USERNAME } from '$lib/constants';
import { getAllUserInviteCodes, getAllUserRoles, getUserRoles } from '$lib/server/db/queries';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from '../$types';

export const load = (async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	const userRoles = await getUserRoles(event.locals.user.id).then((result) =>
		result.map((r) => r.role)
	);

	// I can do what I want
	const isBigBoss = event.locals.user.username === BIG_BOSS_USERNAME;

	if (!isBigBoss && userRoles.includes('admin') === false) {
		return redirect(302, '/');
	}

	const inviteCodes = await getAllUserInviteCodes();

	console.log('roles', { roles: userRoles });
	console.log('inviteCodes', { inviteCodes });

	return {
		userRoles,
		roles: await getAllUserRoles(),
		inviteCodes
	};
}) satisfies PageServerLoad;
