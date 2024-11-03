import type { LayoutServerLoad } from './$types';

export const load = (async (event) => {
	const navItems = [];
	let isLoggedIn = Boolean(event.locals.user);

	console.log('RUNNING LAYOUT SERVER', { isLoggedIn });

	if (isLoggedIn) {
		navItems.push(
			{ name: 'Home', href: '/home' },
			{ name: 'Shares', href: '/shares' },
			{ name: 'Settings (TODO)', href: '/settings' }
		);
	} else {
		navItems.push({ name: 'Login / Register', href: '/login' });
	}

	return {
		isLoggedIn,
		navItems
	};
}) satisfies LayoutServerLoad;
