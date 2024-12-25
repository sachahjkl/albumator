import { isAdmin } from './server/auth';

export const getNavItems = (user: { username: string; roles: string[] } | null) => {
	const navItems = [];
	if (user) {
		navItems.push(
			{ name: 'Home', href: '/home' },
			{ name: 'Shares', href: '/shares' },
			{ name: 'Settings', href: '/settings' }
		);
		if (isAdmin(user)) {
			navItems.push({ name: 'Admin', href: '/admin' });
		}
		navItems.push({ name: 'About', href: '/about' });
	} else {
		navItems.push({ name: 'Login / Register', href: '/login' });
	}
	return navItems;
};
