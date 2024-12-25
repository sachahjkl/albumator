import { BIG_BOSS_USERNAME } from '$lib/constants';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { hash } from '@node-rs/argon2';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { eq } from 'drizzle-orm';
import { HASH_PARAMETERS } from './crypto';
import { getUserLimits, getUserRoles } from './db/queries';

const DAY_IN_MS = 1000 * 60 * 60 * 24;

export const sessionCookieName = 'auth-session';

function generateSessionToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(20));
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}

export async function createSession(userId: string): Promise<table.Session> {
	const token = generateSessionToken();
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: table.Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 30)
	};
	await db.insert(table.session).values(session);
	return session;
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(table.session).where(eq(table.session.id, sessionId));
}

export async function validateSession(sessionId: string) {
	const [result] = await db
		.select({
			// Adjust user table here to tweak returned data
			user: { id: table.user.id, username: table.user.username },
			session: table.session
		})
		.from(table.session)
		.innerJoin(table.user, eq(table.session.userId, table.user.id))
		.where(eq(table.session.id, sessionId));

	if (!result) {
		return { session: null, user: null };
	}
	const { session, user } = result;

	const sessionExpired = Date.now() >= session.expiresAt.getTime();
	if (sessionExpired) {
		await db.delete(table.session).where(eq(table.session.id, session.id));
		return { session: null, user: null };
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;
	if (renewSession) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
		await db
			.update(table.session)
			.set({ expiresAt: session.expiresAt })
			.where(eq(table.session.id, session.id));
	}

	const roles = getUserRoles(user.id);
	const limits = getUserLimits(user.id);

	return { session, user: { ...user, roles: await roles, limits: await limits } };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSession>>;

export const isAdmin = (user: { username: string; roles: string[] }) => {
	// I can do what I want
	const isBigBoss = user.username === BIG_BOSS_USERNAME;
	return isBigBoss || user.roles.includes('admin');
};

export const getDemoUser = async () => {
	// try to get demo user
	let demoUser = await db
		.select()
		.from(table.user)
		.where(eq(table.user.username, table.DEMO_USER.username))
		.execute()
		.then((res) => res.at(0));

	if (!demoUser) {
		// insert demo user
		demoUser = await db
			.insert(table.user)
			.values({
				id: table.DEMO_USER.id,
				username: table.DEMO_USER.username,
				passwordHash: await hash(table.DEMO_USER.password, HASH_PARAMETERS),
				usedInviteId: null
			})
			.returning()
			.then((res) => res.at(0));
		if (!demoUser) {
			throw new Error('An error has occurred during demo user insertion');
		}
	}
	return demoUser;
};
