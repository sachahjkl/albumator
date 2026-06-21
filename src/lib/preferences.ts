import { debounce } from 'ts-debounce';
import type { Preferences } from './server/db/schema';

export const pushPreferences = debounce(
	async (preferences: Preferences, callback: (prefs: Preferences) => void) => {
		const res = await fetch('/preferences', {
			method: 'POST',
			body: JSON.stringify(preferences),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		let json = await res.json();
		callback(json);
	},
	500
);
