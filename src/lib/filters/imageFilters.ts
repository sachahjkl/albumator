import { MAX_IMAGE_SIZE, SUPPORTED_IMAGE_FORMATS } from '$lib/constants';
import imageType from 'image-type';
import type { AsyncFilter, FilteredItem, FilterResult, SyncFilter } from '.';

export function filterSync<T>(
	values: Array<T>,
	filters: Array<SyncFilter<T>>
): Array<FilteredItem<T>> {
	return values.map((item) => {
		let result: FilterResult = { rejected: false };
		for (const filter of filters) {
			result = filter(item);
			if (result.rejected) {
				return {
					item,
					...result
				};
			}
		}
		return {
			item,
			...result
		};
	});
}

export async function filterAsync<T>(
	values: Array<T>,
	filters: Array<AsyncFilter<T>>
): Promise<Array<FilteredItem<T>>> {
	return await Promise.all(
		values.map(async (item) => {
			let result: FilterResult = { rejected: false };
			for (const filter of filters) {
				result = await filter(item);
				if (result.rejected) {
					return {
						item,
						...result
					};
				}
			}
			return {
				item,
				...result
			};
		})
	);
}

export type SizeFilterInput = { name: string; blob: Buffer<ArrayBufferLike> };
export const sizeFilter = (async (image: SizeFilterInput) => {
	const imageSize = image.blob.byteLength;
	if (imageSize > MAX_IMAGE_SIZE) {
		return {
			rejected: true,
			reason: `Image '${image.name}'is too big (max size: ${MAX_IMAGE_SIZE / 1024 / 1024}MB)`
		};
	} else {
		return {
			rejected: false
		};
	}
}) satisfies AsyncFilter<SizeFilterInput>;

export type SupportedFormatFilterInput = {
	name: string;
	path: string;
	blob: Buffer<ArrayBufferLike>;
};
export const supportedFormatFilter = (async (image: SupportedFormatFilterInput) => {
	const isSupported = await imageType(image.blob).then((type) =>
		SUPPORTED_IMAGE_FORMATS.find(
			(supported) => supported.mime === type?.mime && supported.ext === type?.ext
		)
	);
	if (!isSupported) {
		return {
			rejected: true,
			reason: `Image '${image.name}' is not in a supported format`
		};
	} else {
		return {
			rejected: false
		};
	}
}) satisfies AsyncFilter<SupportedFormatFilterInput>;

export type SupportedExtensionFilterInput = {
	name: string;
	path: string;
};
export const supportedExtensionFilter = ((image: SupportedExtensionFilterInput) => {
	const isSupported = SUPPORTED_IMAGE_FORMATS.map((supported) => supported.ext).includes(
		image.path.split('.')[1] ?? 'not splittable'
	);
	if (!isSupported) {
		return {
			rejected: true,
			reason: `Image '${image.name}' doesn't end with a supported extension`
		};
	} else {
		return {
			rejected: false
		};
	}
}) satisfies SyncFilter<SupportedExtensionFilterInput>;

export const supportedExtensionFilterAsync = (async (image: SupportedExtensionFilterInput) =>
	supportedExtensionFilter(image)) satisfies AsyncFilter<SupportedExtensionFilterInput>;

export const defaultImageFilters = [
	sizeFilter,
	supportedExtensionFilterAsync,
	supportedFormatFilter
];
