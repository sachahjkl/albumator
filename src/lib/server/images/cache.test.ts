import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, test } from 'node:test';
import {
	beginImageCacheLease,
	collectImageCacheStats,
	createImageVariantCacheKey,
	deduplicateCacheGeneration,
	evictImageCache,
	invalidateImageVariants,
	readCachedImageVariant,
	writeCachedImageVariant
} from './cache';

const directories: string[] = [];

const createCacheDirectory = async () => {
	const directory = await mkdtemp(path.join(os.tmpdir(), 'albumator-cache-'));
	directories.push(directory);
	process.env.IMAGE_CACHE_DIR = directory;
	process.env.IMAGE_CACHE_CLEANUP_INTERVAL_SECONDS = '0';
	process.env.IMAGE_CACHE_MAX_AGE_SECONDS = '0';
	return directory;
};

afterEach(async () => {
	delete process.env.IMAGE_CACHE_DIR;
	delete process.env.IMAGE_CACHE_CLEANUP_INTERVAL_SECONDS;
	delete process.env.IMAGE_CACHE_MAX_AGE_SECONDS;
	delete process.env.IMAGE_CACHE_MAX_BYTES;
	await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

test('cache keys never contain the image id as a path component', () => {
	const key = createImageVariantCacheKey('../../private/image', 256, 'webp');
	assert.match(key, /^v2\/[A-Za-z0-9_-]{2}\/[A-Za-z0-9_-]+-w256\.webp$/);
	assert.equal(key.includes('..'), false);
});

test('cache writes publish complete buffers', async () => {
	await createCacheDirectory();
	const key = createImageVariantCacheKey('image', 256, 'webp');
	const expected = Buffer.alloc(1024 * 64, 7);

	assert.equal(await writeCachedImageVariant(key, expected), true);
	const cached = await readCachedImageVariant(key);
	assert.deepEqual(cached?.buffer, expected);
});

test('concurrent generation is deduplicated', async () => {
	let generations = 0;
	const work = () =>
		deduplicateCacheGeneration('same-key', async () => {
			generations += 1;
			await new Promise((resolve) => setTimeout(resolve, 10));
			return 'result';
		});

	assert.deepEqual(await Promise.all(Array.from({ length: 20 }, work)), Array(20).fill('result'));
	assert.equal(generations, 1);
});

test('invalidation prevents an older request from publishing a variant', async () => {
	await createCacheDirectory();
	const imageId = 'deleted-image';
	const key = createImageVariantCacheKey(imageId, 256, 'webp');
	const lease = beginImageCacheLease(imageId);
	const { promise: generationMayFinish, resolve: continueGeneration } =
		Promise.withResolvers<void>();

	const generation = deduplicateCacheGeneration(key, async () => {
		await generationMayFinish;
		return writeCachedImageVariant(key, Buffer.from('stale'), lease);
	});
	const invalidation = invalidateImageVariants(imageId);
	continueGeneration();

	assert.equal(await generation, false);
	await invalidation;
	assert.equal(await readCachedImageVariant(key), null);
	lease.release();
});

test('eviction keeps the cache under its byte limit', async () => {
	await createCacheDirectory();
	process.env.IMAGE_CACHE_MAX_BYTES = '10';

	await writeCachedImageVariant(createImageVariantCacheKey('first', 32, 'webp'), Buffer.alloc(8));
	await writeCachedImageVariant(createImageVariantCacheKey('second', 32, 'webp'), Buffer.alloc(8));
	await evictImageCache();

	const stats = await collectImageCacheStats();
	assert.ok(stats.bytes <= 10);
});
