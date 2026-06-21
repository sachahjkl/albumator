import { RESPONSIVE_IMAGE_WIDTHS } from '$lib/constants';

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
		shareId,
		url: `${urlPrefix}/${image.id}?shareId=${shareId}`,
		...image
	});
}

export function getResponsiveImageUrl(imageId: string, width?: number, shareId?: string) {
	const url = new URL(`/images/${imageId}`, 'http://albumator.local');

	if (width) {
		url.searchParams.set('w', width.toString());
	}

	if (shareId) {
		url.searchParams.set('shareId', shareId);
	}

	return `${url.pathname}${url.search}`;
}

export function getResponsiveImageWidths(imageWidth: number, maxWidth = 2048) {
	if (imageWidth <= 0) {
		return RESPONSIVE_IMAGE_WIDTHS.filter((candidate) => candidate <= maxWidth);
	}

	const widths = RESPONSIVE_IMAGE_WIDTHS.filter(
		(candidate) => candidate <= imageWidth && candidate <= maxWidth
	);

	return widths.length === 0 ? [Math.min(imageWidth, maxWidth)] : widths;
}

export function getLargestResponsiveImageWidth(imageWidth: number, maxWidth = 2048) {
	return getResponsiveImageWidths(imageWidth, maxWidth).at(-1) ?? Math.min(imageWidth, maxWidth);
}

export function getPreferredResponsiveImageWidth(
	imageWidth: number,
	displayWidth: number,
	maxWidth = 2048
) {
	const widths = getResponsiveImageWidths(imageWidth, maxWidth);
	const preferredWidth = Math.max(32, Math.ceil(displayWidth));

	return (
		widths.find((width) => width >= preferredWidth) ??
		widths.at(-1) ??
		Math.min(imageWidth, maxWidth)
	);
}

export function getResponsiveImageSrcSet(imageId: string, imageWidth: number, shareId?: string) {
	const widths = getResponsiveImageWidths(imageWidth);

	if (imageWidth > 2048) {
		return [
			...widths.map((width) => `${getResponsiveImageUrl(imageId, width, shareId)} ${width}w`),
			`${getResponsiveImageUrl(imageId, undefined, shareId)} ${imageWidth}w`
		].join(', ');
	}

	return widths
		.map((width) => `${getResponsiveImageUrl(imageId, width, shareId)} ${width}w`)
		.join(', ');
}
