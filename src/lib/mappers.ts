import type { NewImage } from './server/db/queries';

export type FilesWithProperties = {
	file: File;
	name: string;
	metadata?: {
		dateTaken: Date;
	};
	// Others will be added later
};

export const AddPropertiesToFiles = (files: File[], formData: FormData) =>
	files.map((file) => {
		let name = formData.get('name-file-' + file.name)?.toString();

		if (!name) {
			name = file.name;
		}

		return {
			file,
			name: name,
			metadata: {
				dateTaken: new Date()
			}
		};
	});

export const fileWithPropertiesToNewImage = (userId: string) => {
	const defaultMetadata = {
		dateTaken: new Date()
	};

	return async (formImage: FilesWithProperties) => ({
		name: formImage.name,
		path: formImage.file.name,
		metadata: formImage.metadata ?? defaultMetadata,
		userId,
		mimeType: formImage.file.type,
		blob: Buffer.from(await formImage.file.arrayBuffer())
	});
};

export const filesWithPropertiesToNewImages = async (
	withProperties: FilesWithProperties[],
	userId: string
): Promise<NewImage[]> => {
	return await Promise.all(withProperties.map(fileWithPropertiesToNewImage(userId)));
};

export function imageWithUrl<T extends { id: string }>(urlPrefix = '/images') {
	return (image: T) => ({
		url: `${urlPrefix}/${image.id}`,
		...image
	});
}

export function imageWithSharedUrl<T extends { id: string }>(
	shareId: string,
	urlPrefix = '/images'
) {
	return (image: T) => ({
		url: `${urlPrefix}/${image.id}?shareId=${shareId}`,
		...image
	});
}
