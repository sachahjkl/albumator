import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// TODO: get list of ids to delete, and delete the ones the user has access to
	return new Response();
};
