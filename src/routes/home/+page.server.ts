import {
	AddPropertiesToFiles as addPropertiesToFiles,
	filesWithPropertiesToNewImages
} from '$lib/mappers';
import {
	getUserImages,
	getUserPreferences,
	insertImages,
	newShare,
	type InsertedImage
} from '$lib/server/db/queries';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	return {
		user: event.locals.user,
		images: await getUserImages(event.locals.user.id, 1),
		preferences: await getUserPreferences(event.locals.user.id)
	};
};

export const actions: Actions = {
	uploadImage: async (event) => {
		// TODO: maybe migrate this to a regular server.ts route and use fetch to upload the files
		if (!event.locals.user) {
			redirect(302, '/login');
		}

		const formData = await event.request.formData();

		const files = formData.getAll('file') as File[];

		if (!files) {
			return fail(400, { message: 'No files provided' });
		}

		const nonEmptyFiles = files.filter((file) => file.size !== 0);

		if (nonEmptyFiles.length == 0) {
			return fail(400, { message: 'At least one file is needed' });
		}

		console.info('files', { nonEmptyFiles });
		for (const file of nonEmptyFiles) {
			if (file instanceof File == false) {
				return fail(400, { message: 'Invalid request' });
			}

			if (file.name.length == 0) {
				return fail(400, { message: `File name ${file.name} is empty` });
			}
		}

		const userId = event.locals.user.id;
		const filesWithProperties = addPropertiesToFiles(nonEmptyFiles, formData);
		const newImages = await filesWithPropertiesToNewImages(filesWithProperties, userId);

		let uploadedImages = [] as InsertedImage[];
		try {
			uploadedImages = await insertImages(newImages);

			if (!uploadedImages) {
				return fail(500, { message: 'An error has occurred during upload' });
			}
		} catch (e) {
			if (e instanceof Error) {
				console.error(e);
				return fail(500, { message: e.message });
			}
		}

		return { success: true, uploadedImages };
	},
	shareImages: async (event) => {
		if (!event.locals.user) {
			redirect(302, '/login');
		}

		const formData = await event.request.formData();
		const name = formData.get('name') as string;
		const imagesJsonArray = formData.get('imageIds') as string;
		const expiration = formData.get('expiration') as string;

		if (!imagesJsonArray) {
			return fail(400, {
				shareStatus: 'error',
				shareMessage: 'No images provided'
			});
		}

		const imageIds = JSON.parse(imagesJsonArray);

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
