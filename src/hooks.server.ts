import { dev } from '$app/environment';
import * as auth from '$lib/server/auth.js';
import { startImageCacheMaintenance } from '$lib/server/images/cache';
import type { Handle } from '@sveltejs/kit';

startImageCacheMaintenance();

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.sessionCookieName);
	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return withSecurityHeaders(await resolve(event));
	}

	const { session, user } = await auth.validateSession(sessionToken);
	if (session) {
		event.cookies.set(auth.sessionCookieName, sessionToken, {
			path: '/',
			sameSite: 'lax',
			httpOnly: true,
			expires: session.expiresAt,
			secure: !dev
		});
	} else {
		event.cookies.delete(auth.sessionCookieName, { path: '/' });
	}

	event.locals.user = user;
	event.locals.session = session;

	return withSecurityHeaders(await resolve(event));
};

function withSecurityHeaders(response: Response) {
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	return response;
}

export const handle: Handle = handleAuth;
