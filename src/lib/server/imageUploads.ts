import { deriveImageData } from '$lib/server/images';
import type { FilesWithProperties } from '$lib/mappers';
import type { NewImage } from '$lib/server/db/queries';
import imageType from 'image-type';

export const fileWithPropertiesToNewImage = (userId: string) => {
	const defaultMetadata = {
		dateTaken: new Date()
	};

	return async (formImage: FilesWithProperties) => {
		const blob = Buffer.from(await formImage.file.arrayBuffer());
		const detectedType = await imageType(blob);

		if (!detectedType) {
			throw new Error('Unsupported image format');
		}

		return {
			...(await deriveImageData(blob)),
			name: formImage.name,
			path: formImage.file.name,
			metadata: formImage.metadata ?? defaultMetadata,
			userId,
			mimeType: detectedType.mime,
			blob
		} satisfies NewImage;
	};
};

export const filesWithPropertiesToNewImages = async (
	withProperties: FilesWithProperties[],
	userId: string
): Promise<NewImage[]> => {
	return await Promise.all(withProperties.map(fileWithPropertiesToNewImage(userId)));
};
