import { GUEST_INFINITE_SCROLL_PAGE_SIZE } from '$lib/constants';
import { getShareImages } from '$lib/server/db/queries';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const shareId = event.params.id;

	if (!shareId) {
		error(400, 'Share ID missing');
	}

	const currentPageParam = event.url.searchParams.get('page');

	let page = 1;

	if (currentPageParam) {
		page = Number.parseInt(currentPageParam);
	}

	if (isNaN(page)) {
		error(400, 'Invalid page provided');
	}

	// page size is static for now, we'll infinitely load them page per page. maybe we'll add a page size param
	let pageSize = GUEST_INFINITE_SCROLL_PAGE_SIZE;

	return json(await getShareImages(shareId, page, pageSize));
};
