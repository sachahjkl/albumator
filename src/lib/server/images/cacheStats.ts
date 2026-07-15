import { collectImageCacheStats, getImageCacheConfig } from './cache';

const config = getImageCacheConfig();
const stats = await collectImageCacheStats();

console.log(JSON.stringify({ cacheDir: config.directory, ...stats }, null, 2));
