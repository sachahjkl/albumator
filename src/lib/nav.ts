import { BIG_BOSS_USERNAME } from './constants';

export const getNavItems = (user: { username: string } | null) => {
	const navItems = [];
	if (user) {
		navItems.push(
			{ name: 'Home', href: '/home' },
			{ name: 'Shares', href: '/shares' },
			{ name: 'Settings', href: '/settings' }
		);
		if (user.username === BIG_BOSS_USERNAME) {
			navItems.push({ name: 'Admin', href: '/admin' });
		}
	} else {
		navItems.push({ name: 'Login / Register', href: '/login' });
	}
	return navItems;
};
