import * as auth from '$lib/server/auth';
import { generateId } from '$lib/server/crypto';
import { getUserImages, insertImage } from '$lib/server/db/queries';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	let pageSize = 10;
	if (event.url.searchParams.get('pageSize')) {
		pageSize = Number.parseInt(event.url.searchParams.get('pageSize') as string);
	}

	pageSize = Math.min(pageSize, 100);

	let page = 1;
	if (event.url.searchParams.get('page')) {
		page = Number.parseInt(event.url.searchParams.get('page') as string);
	}

	return {
		user: event.locals.user,
		images: getUserImages(event.locals.user.id, page, pageSize)
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
	uploadImage: async (event) => {
		if (!event.locals.session || !event.locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}
		const formData = await event.request.formData();
		const name = formData.get('name');
		if (!name) {
			return fail(400, { message: 'Name is mandatory' });
		}

		const dateTaken = new Date();
		const file = formData.get('file');

		if (!file) {
			return fail(400, { message: 'File is mandatory' });
		}

		console.info({ fileData: file });

		if (file instanceof File == false) {
			return fail(400, { message: 'Invalid request' });
		}

		if (file.size == 0) {
			return fail(400, { message: 'File is empty' });
		}

		const uploadedImage = await insertImage({
			name: name.toString(),
			path: file.name,
			metadata: {
				dateTaken
			},
			userId: event.locals.user.id,
			mimeType: file.type,
			blob: Buffer.from(await file.arrayBuffer())
		}).then((result) => result.at(0));

		if (!uploadedImage) {
			return fail(500, { message: 'An error has occurred during upload' });
		}

		return { success: true };
	},
	shareImages: async (event) => {
		if (!event.locals.user) {
			return fail(401, {
				message: 'Unauthorized'
			});
		}

		const formData = await event.request.formData();
		const name = formData.get('name');
		const _expiration = formData.get('expiration');

		if (!name) {
			return fail(400, { shareDialog: { success: false as const, message: 'Name is mandatory' } });
		}

		if (name.toString().length < 10) {
			return fail(400, { shareDialog: { success: false as const, message: 'Name is too short' } });
		}

		const shareId = generateId();

		return {
			shareDialog: {
				success: true as const,
				shareId
			}
		};
	}
};
