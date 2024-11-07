import { getNavItems } from '$lib/nav';
import type { LayoutServerLoad } from './$types';

export const load = (async (event) => {
	let isLoggedIn = Boolean(event.locals.user);

	const navItems = getNavItems(isLoggedIn);

	return {
		isLoggedIn,
		navItems,
		initialFilter: event.url.searchParams.get('filter') ?? ''
	};
}) satisfies LayoutServerLoad;
