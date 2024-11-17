import { getUserPreferences, updateUserPreferences } from '$lib/server/db/queries';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return error(401, 'Unauthorized');
	}
	const preferences = await getUserPreferences(event.locals.user.id);

	if (!preferences) {
		return error(404, 'Preferences not found');
	}
	return json(preferences);
};

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return error(401, 'Unauthorized');
	}
	const preferences = await event.request.json();

	if (!preferences) {
		error(400, 'Invalid preferences');
	}

	let updatedPreferences = await updateUserPreferences(event.locals.user.id, preferences);

	return json(updatedPreferences);
};
