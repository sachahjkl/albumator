import { NAMES_LIST } from './constants';

export function generateRandomName(numberOfNames: number = 4) {
	if (!Number.isInteger(numberOfNames) || numberOfNames < 0) {
		throw new RangeError('numberOfNames must be a non-negative integer');
	}

	const accumulator = Array(numberOfNames).fill('');
	for (let i = 0; i < numberOfNames; i++) {
		accumulator[i] += NAMES_LIST[Math.floor(Math.random() * NAMES_LIST.length)];
	}
	return accumulator.join(' ');
}

export const textFilter = (filter: string) => {
	const normalizedFilter = filter.toLowerCase();
	return (value: { name: string }) => value.name.toLowerCase().includes(normalizedFilter);
};

export const onKeysDown = (
	keys: string[],
	e: KeyboardEvent,
	callback: (e: KeyboardEvent) => void
) => {
	if (keys.includes(e.code)) {
		e.preventDefault();
		callback(e);
	}
};

export const daysBetween = (startDate: Date, endDate: Date) => {
	// The number of milliseconds in all UTC days (no DST)
	const oneDay = 1000 * 60 * 60 * 24;

	// A day in UTC always lasts 24 hours (unlike in other time formats)
	const start = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
	const end = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

	// so it's safe to divide by 24 hours
	return (start - end) / oneDay;
};
