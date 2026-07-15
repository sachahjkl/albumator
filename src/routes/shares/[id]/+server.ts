import { GUEST_INFINITE_SCROLL_PAGE_SIZE } from '$lib/constants';
import { getShareImages } from '$lib/server/db/queries';
import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const shareId = event.params.id;

	if (!shareId) {
		error(400, 'Share ID missing');
	}

	const currentPageParam = event.url.searchParams.get('page');

	let { data: currentPage, ...pageInfo } = z.coerce
		.number()
		.int()
		.min(1)
		.safeParse(currentPageParam);
	if (pageInfo.success === false) {
		error(400, 'Invalid page provided, ' + pageInfo.error.message);
	}

	// page size is static for now, we'll infinitely load them page per page. maybe we'll add a page size param
	const pageSize = GUEST_INFINITE_SCROLL_PAGE_SIZE;

	return json(await getShareImages(shareId, currentPage, pageSize));
};
