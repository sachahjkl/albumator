import { getUserImages } from '$lib/server/db/queries';
import { error, json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/');
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
	let pageSize = 15;

	return json(await getUserImages(event.locals.user.id, page, pageSize));
};
