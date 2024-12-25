import { HASH_PARAMETERS } from '$lib/server/crypto';
import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { hash, verify } from '@node-rs/argon2';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load = (async () => {
	return {};
}) satisfies PageServerLoad;

export const actions: Actions = {
	deleteme: async (event) => {
		if (!event.locals.user) {
			return fail(401);
		}

		const formData = await event.request.formData();

		if (formData.get('confirm-one') !== 'on') {
			return fail(400, { message: 'Invalid, first confirmation is required' });
		}

		if (formData.get('confirm-two') !== 'on') {
			return fail(400, { message: 'Invalid, second confirmation is required' });
		}

		await db.delete(table.user).where(eq(table.user.id, event.locals.user.id));

		return redirect(302, '/login');
	},
	changepassword: async (event) => {
		if (!event.locals.user) {
			return fail(401);
		}

		const formData = await event.request.formData();

		const oldPassword = formData.get('old-password');
		const newPassword = formData.get('new-password');
		const newPasswordConfirm = formData.get('new-password-confirm');

		if (!oldPassword) {
			return fail(400, { message: 'Old password is required' });
		}

		if (!newPassword) {
			return fail(400, { message: 'New password is required' });
		}

		if (!newPasswordConfirm) {
			return fail(400, { message: 'Confirm new password is required' });
		}
		if (newPassword !== newPasswordConfirm) {
			return fail(400, { message: 'New passwords do not match' });
		}

		const results = await db
			.select()
			.from(table.user)
			.where(eq(table.user.username, event.locals.user.username));

		const existingUser = results.at(0);
		if (!existingUser) {
			return fail(400, { message: 'Incorrect username or password' });
		}

		const validPassword = await verify(
			existingUser.passwordHash,
			oldPassword.toString(),
			HASH_PARAMETERS
		);
		if (!validPassword) {
			return fail(400, { message: 'Incorrect username or password' });
		}

		const passwordHash = await hash(newPassword.toString(), HASH_PARAMETERS);

		try {
			await db
				.update(table.user)
				.set({ passwordHash })
				.where(eq(table.user.id, event.locals.user.id));
		} catch (e) {
			return fail(500, { message: 'An error has occurred' });
		}

		return { success: true, message: 'Password changed successfully' };
	}
};
