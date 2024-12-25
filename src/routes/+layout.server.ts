import { env } from '$env/dynamic/public';
import { getNavItems } from '$lib/nav';
import type { LayoutServerLoad } from './$types';

export const load = (async (event) => {
	let isLoggedIn = Boolean(event.locals.user);

	const navItems = getNavItems(event.locals.user);

	return {
		username: event.locals.user?.username,
		isLoggedIn,
		navItems,
		initialFilter: event.url.searchParams.get('filter') ?? '',
		commitHash: env.PUBLIC_COMMIT_HASH
	};
}) satisfies LayoutServerLoad;
