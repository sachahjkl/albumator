import type { PageServerLoad } from './$types';

export const load = (async () => {
	return {
		share: {
			id: 's4f6s5f49874d',
			name: 'share name'
		}
	};
}) satisfies PageServerLoad;
