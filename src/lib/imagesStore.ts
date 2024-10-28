import { writable } from 'svelte/store';
import type { Image } from './server/db/schema';

export const imagesStore = writable<Image[]>([]);
