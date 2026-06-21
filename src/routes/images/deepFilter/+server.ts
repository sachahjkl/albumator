import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	event.url.searchParams.get('filter');
	// TODO: add deep fetch when filter returns no results
	return new Response();
};
