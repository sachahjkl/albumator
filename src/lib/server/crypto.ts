import { generateRandomString } from '@oslojs/crypto/random';

export const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';

export const cryptoRandom = {
	read: (bytes: Uint8Array) => crypto.getRandomValues(bytes as Uint8Array<ArrayBuffer>)
};

export function generateId(length = 21): string {
	return generateRandomString(cryptoRandom, alphabet, length);
}

// DO NOT TOUCH OR ALL STORED PASSWORDS WILL BE BROKEN
export const HASH_PARAMETERS = {
	// recommended minimum parameters
	memoryCost: 19456,
	timeCost: 2,
	outputLen: 32,
	parallelism: 1
};
