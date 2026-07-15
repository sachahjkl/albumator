import {
	MAX_UPLOAD_FILES,
	MAX_UPLOAD_TOTAL_SIZE,
	MAX_IMAGE_SIZE,
	USER_INFINITE_SCROLL_PAGE_SIZE
} from '$lib/constants';
import { AddPropertiesToFiles as addPropertiesToFiles } from '$lib/mappers';
import { filesWithPropertiesToNewImages } from '$lib/server/imageUploads';
import {
	getUserImages,
	getUserImageCount,
	getUserPreferences,
	getUserShareCount,
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
		images: await getUserImages(event.locals.user.id, 1, USER_INFINITE_SCROLL_PAGE_SIZE),
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

		const files = formData.getAll('file');

		if (files.length === 0) {
			return fail(400, { message: 'No files provided' });
		}
		if (!files.every((file): file is File => file instanceof File)) {
			return fail(400, { message: 'Invalid request' });
		}

		const nonEmptyFiles = files.filter((file) => file.size !== 0);

		if (nonEmptyFiles.length == 0) {
			return fail(400, { message: 'At least one file is needed' });
		}
		if (nonEmptyFiles.length > MAX_UPLOAD_FILES) {
			return fail(413, {
				message: `A maximum of ${MAX_UPLOAD_FILES} files can be uploaded at once`
			});
		}
		if (nonEmptyFiles.some((file) => file.size > MAX_IMAGE_SIZE)) {
			return fail(413, { message: 'An image exceeds the maximum allowed size' });
		}
		if (nonEmptyFiles.reduce((total, file) => total + file.size, 0) > MAX_UPLOAD_TOTAL_SIZE) {
			return fail(413, { message: 'The upload is too large' });
		}
		if (
			(await getUserImageCount(event.locals.user.id)) + nonEmptyFiles.length >
			event.locals.user.limits.images
		) {
			return fail(409, { message: 'Your image limit would be exceeded' });
		}

		for (const file of nonEmptyFiles) {
			if (file.name.length == 0) {
				return fail(400, { message: `File name ${file.name} is empty` });
			}
		}

		const userId = event.locals.user.id;
		const filesWithProperties = addPropertiesToFiles(nonEmptyFiles, formData);

		let uploadedImages = [] as InsertedImage[];
		try {
			const newImages = await filesWithPropertiesToNewImages(filesWithProperties, userId);
			uploadedImages = await insertImages(newImages);

			if (!uploadedImages) {
				return fail(500, { message: 'An error has occurred during upload' });
			}
		} catch (e) {
			if (e instanceof Error) {
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

		let imageIds: unknown;
		try {
			imageIds = JSON.parse(imagesJsonArray);
		} catch {
			return fail(400, {
				shareStatus: 'error',
				shareMessage: 'Invalid images provided'
			});
		}

		if (
			!Array.isArray(imageIds) ||
			imageIds.length > 1000 ||
			!imageIds.every((id) => typeof id === 'string')
		) {
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
		if ((await getUserShareCount(event.locals.user.id)) >= event.locals.user.limits.shares) {
			return fail(409, {
				shareStatus: 'error',
				shareMessage: 'Your share limit has been reached'
			});
		}

		try {
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
		} catch (e) {
			if (e instanceof Error) {
				return fail(500, { shareStatus: 'error', shareMessage: e.message });
			}
			return fail(500, { shareStatus: 'error', shareMessage: 'An error has occurred' });
		}
	}
};
