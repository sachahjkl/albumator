import { USER_INFINITE_SCROLL_PAGE_SIZE } from '$lib/constants';
import { getUserImages } from '$lib/server/db/queries';
import { error, json, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/');
	}

	const currentPageParam = event.url.searchParams.get('page');

	let { data: currentPage, ...pageInfo } = z.coerce.number().safeParse(currentPageParam);

	if (pageInfo.success === false) {
		error(400, pageInfo.error.issues.map((issue) => issue.message).join(', '));
	}

	// page size is static for now, we'll infinitely load them page per page. maybe we'll add a page size param
	let pageSize = USER_INFINITE_SCROLL_PAGE_SIZE;

	return json(await getUserImages(event.locals.user.id, currentPage, pageSize));
};
