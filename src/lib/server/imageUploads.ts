import { deriveImageData } from '$lib/server/images';
import type { FilesWithProperties } from '$lib/mappers';
import type { NewImage } from '$lib/server/db/queries';

export const fileWithPropertiesToNewImage = (userId: string) => {
	const defaultMetadata = {
		dateTaken: new Date()
	};

	return async (formImage: FilesWithProperties) => {
		const blob = Buffer.from(await formImage.file.arrayBuffer());

		return {
			...(await deriveImageData(blob)),
			name: formImage.name,
			path: formImage.file.name,
			metadata: formImage.metadata ?? defaultMetadata,
			userId,
			mimeType: formImage.file.type,
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
