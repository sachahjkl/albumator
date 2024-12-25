import { isAdmin } from '$lib/server/auth';
import { getAllRoles, getAllUserInviteCodes } from '$lib/server/db/queries';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from '../$types';

export const load = (async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	if (isAdmin(event.locals.user) == false) {
		return redirect(302, '/');
	}

	const inviteCodes = await getAllUserInviteCodes();

	console.log({
		roles: event.locals.user.roles,
		inviteCodes
	});

	return {
		userRoles: event.locals.user.roles,
		roles: (await getAllRoles()).map((role) => role.name),
		inviteCodes
	};
}) satisfies PageServerLoad;
