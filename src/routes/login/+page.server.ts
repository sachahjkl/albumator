import { dev } from '$app/environment';
import { TECH_TIPS } from '$lib/constants';
import * as auth from '$lib/server/auth';
import { alphabet, HASH_PARAMETERS } from '$lib/server/crypto';
import { db } from '$lib/server/db';
import { getInviteCode } from '$lib/server/db/queries';
import * as table from '$lib/server/db/schema';
import { hash, verify } from '@node-rs/argon2';
import { generateRandomString } from '@oslojs/crypto/random';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/');
	}
	return {
		techTip: TECH_TIPS[Math.floor(Math.random() * TECH_TIPS.length)]
	};
};

export const actions: Actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await auth.invalidateSession(event.locals.session.id);
		event.cookies.delete(auth.sessionCookieName, { path: '/' });

		return redirect(302, '/login');
	},
	login: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		// Special case handling: Demo user
		if (username === table.DEMO_USER.username && password === table.DEMO_USER.password) {
			let demoUser = await auth.getDemoUser();
			await initSession(event, demoUser.id);
			return redirect(302, '/home');
		}

		if (!validateUsername(username)) {
			return fail(400, { message: 'Invalid username' });
		}
		if (!validatePassword(password)) {
			return fail(400, { message: 'Invalid password' });
		}

		const existingUser = await db
			.select()
			.from(table.user)
			.where(eq(table.user.username, username))
			.then((users) => users.at(0));

		if (!existingUser) {
			return fail(400, { message: 'Incorrect username or password' });
		}

		const validPassword = await verify(existingUser.passwordHash, password, HASH_PARAMETERS);
		if (!validPassword) {
			return fail(400, { message: 'Incorrect username or password' });
		}

		await initSession(event, existingUser.id);

		return redirect(302, '/home');
	},
	register: async (event) => {
		const formData = await event.request.formData();
		const username = formData.get('username');
		const password = formData.get('password');
		const invite = formData.get('invite');

		const failWithValues = (message: string, status = 400) =>
			fail(status, { message, username, password, invite });

		if (!validateUsername(username)) {
			return failWithValues('Invalid username');
		}
		if (!validatePassword(password)) {
			return failWithValues('Invalid password');
		}
		if (!validateInvite(invite)) {
			return failWithValues('Invalid invite');
		}

		const dbInvite = await getInviteCode(invite);

		if (!dbInvite) {
			return failWithValues('Invalid invite');
		}

		if (dbInvite.expiresAt < new Date()) {
			return failWithValues('Invite expired');
		}

		const userId = generateUserId();
		const passwordHash = await hash(password, HASH_PARAMETERS);

		try {
			await db
				.insert(table.user)
				.values({ id: userId, username, passwordHash, usedInviteId: dbInvite.id });

			await initSession(event, userId);
		} catch (e) {
			let message = 'An error has occurred, please try again later';
			if (e instanceof Error) {
				message = 'Username taken, try another username';
			}
			return failWithValues(message, 500);
		}
		return redirect(302, '/');
	}
};

function generateUserId(length = 21): string {
	return generateRandomString({ read: (bytes) => crypto.getRandomValues(bytes) }, alphabet, length);
}

function validateUsername(username: unknown): username is string {
	return (
		typeof username === 'string' &&
		username.length >= 3 &&
		username.length <= 31 &&
		/^[a-z0-9_-]+$/.test(username)
	);
}

function validatePassword(password: unknown): password is string {
	return typeof password === 'string' && password.length >= 6 && password.length <= 255;
}

function validateInvite(invite: unknown): invite is string {
	return typeof invite === 'string' && invite.length > 0;
}

async function initSession(event: RequestEvent, userId: string) {
	const session = await auth.createSession(userId);
	event.cookies.set(auth.sessionCookieName, session.id, {
		path: '/',
		sameSite: 'lax',
		httpOnly: true,
		expires: session.expiresAt,
		secure: !dev
	});
	return session;
}
