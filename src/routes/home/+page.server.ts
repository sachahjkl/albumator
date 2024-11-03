import {
	AddPropertiesToFiles as addPropertiesToFiles,
	filesWithPropertiesToNewImages
} from '$lib/mappers';
import { getUserImages, insertImages, newShare } from '$lib/server/db/queries';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/');
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
		images: await getUserImages(event.locals.user.id, page, pageSize)
	};
};

export const actions: Actions = {
	uploadImage: async (event) => {
		if (!event.locals.session) {
			return fail(401, { message: 'No session' });
		}

		if (event.locals.user == null) {
			return fail(401, { message: 'No user' });
		}

		const formData = await event.request.formData();
		const name = formData.get('name');

		if (!name) {
			return fail(400, { message: 'Name is mandatory' });
		}

		const files = formData.getAll('file') as File[];

		if (!files) {
			return fail(400, { message: 'No files provided' });
		}

		if (files.length == 0) {
			return fail(400, { message: 'At least one file is mandatory' });
		}

		console.info({ files });

		for (const file of files) {
			if (file instanceof File == false) {
				return fail(400, { message: 'Invalid request' });
			}

			if (file.size == 0) {
				return fail(400, { message: `File ${file.name} is empty` });
			}
		}

		const userId = event.locals.user.id;
		const filesWithProperties = await addPropertiesToFiles(files, formData);
		const newImages = await filesWithPropertiesToNewImages(filesWithProperties, userId);
		const uploadedImages = await insertImages(newImages);

		if (uploadedImages.rowsAffected <= 0) {
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
		const name = formData.get('name') as string;
		const imagesJson = formData.get('imageIds') as string;
		const expiration = formData.get('expiration') as string;

		if (!imagesJson) {
			return fail(400, {
				shareStatus: 'error',
				shareMessage: 'No images provided'
			});
		}

		const imageIds = JSON.parse(imagesJson);

		if (!Array.isArray(imageIds)) {
			return fail(400, {
				shareStatus: 'error',
				shareMessage: 'Invalid images provided'
			});
		}

		if (!name) {
			return fail(400, {
				shareStatus: 'error',
				shareMessage: 'Name is mandatory'
			});
		}

		if (name.toString().length < 10) {
			return fail(400, {
				shareStatus: 'error',
				shareMessage: 'Name is too short (10 characters minimum)'
			});
		}

		const result = await newShare(
			{
				title: name,
				userId: event.locals.user.id,
				expiresAt: expiration ? new Date(expiration) : undefined
			},
			imageIds
		);

		return {
			shareStatus: 'success',
			shareId: result.shareId
		};
	}
};
