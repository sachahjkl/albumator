import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { BIG_BOSS_USERNAME, TECH_TIPS } from '$lib/constants';
import * as auth from '$lib/server/auth';
import { alphabet, cryptoRandom, HASH_PARAMETERS } from '$lib/server/crypto';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { hash, verify } from '@node-rs/argon2';
import { generateRandomString } from '@oslojs/crypto/random';
import { fail, redirect } from '@sveltejs/kit';
import { and, eq, gt } from 'drizzle-orm';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		return redirect(302, '/');
	}
	return {
		techTip: TECH_TIPS[Math.floor(Math.random() * TECH_TIPS.length)],
		demoEnabled: env.ENABLE_DEMO_USER === 'true'
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
		if (
			env.ENABLE_DEMO_USER === 'true' &&
			username === table.DEMO_USER.username &&
			password === table.DEMO_USER.password
		) {
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

		const failWithValues = (message: string, status = 400) => fail(status, { message, username });

		if (!validateUsername(username)) {
			return failWithValues('Invalid username');
		}
		if (username === BIG_BOSS_USERNAME) {
			return failWithValues('Username reserved');
		}
		if (!validatePassword(password)) {
			return failWithValues('Invalid password');
		}
		if (!validateInvite(invite)) {
			return failWithValues('Invalid invite');
		}

		const userId = generateUserId();
		const passwordHash = await hash(password, HASH_PARAMETERS);

		try {
			await db.transaction(async (tx) => {
				const [dbInvite] = await tx
					.delete(table.inviteCode)
					.where(and(eq(table.inviteCode.code, invite), gt(table.inviteCode.expiresAt, new Date())))
					.returning({ id: table.inviteCode.id });

				if (!dbInvite) {
					throw new Error('Invalid or expired invite');
				}

				await tx
					.insert(table.user)
					.values({ id: userId, username, passwordHash, usedInviteId: dbInvite.id });
			});

			await initSession(event, userId);
		} catch {
			return failWithValues('Username taken or invite invalid/used');
		}
		return redirect(302, '/');
	}
};

function generateUserId(length = 21): string {
	return generateRandomString(cryptoRandom, alphabet, length);
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
	const { session, token } = await auth.createSession(userId);
	event.cookies.set(auth.sessionCookieName, token, {
		path: '/',
		sameSite: 'lax',
		httpOnly: true,
		expires: session.expiresAt,
		secure: !dev
	});
	return session;
}
