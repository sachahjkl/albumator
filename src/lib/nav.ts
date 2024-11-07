export const getNavItems = (isLoggedIn: boolean) => {
	const navItems = [];
	if (isLoggedIn) {
		navItems.push(
			{ name: 'Home', href: '/home' },
			{ name: 'Shares', href: '/shares' },
			{ name: 'Settings', href: '/settings' }
		);
	} else {
		navItems.push({ name: 'Login / Register', href: '/login' });
	}
	return navItems;
};
