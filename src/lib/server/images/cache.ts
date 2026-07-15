import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CACHE_VERSION = 'v2';
const inFlight = new Map<string, Promise<unknown>>();
const imageCacheStates = new Map<string, { generation: number; leases: number }>();
let evictionPromise: Promise<CacheStats> | null = null;
let scheduledEviction: ReturnType<typeof setTimeout> | null = null;
let maintenanceStarted = false;

export type ImageCacheLease = {
	cachePrefix: string;
	generation: number;
	release: () => void;
};

export type CacheStats = {
	files: number;
	bytes: number;
	expiredFiles: number;
	expiredBytes: number;
	byExtension: Record<string, { files: number; bytes: number }>;
};

type CacheEntry = {
	cachePath: string;
	size: number;
	mtimeMs: number;
};

const parseNonNegativeInteger = (value: string | undefined, fallback: number) => {
	if (value === undefined) return fallback;
	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed) || parsed < 0) {
		throw new Error(`Invalid non-negative integer: ${value}`);
	}
	return parsed;
};

export function getImageCacheConfig() {
	return {
		directory: process.env.IMAGE_CACHE_DIR ?? path.resolve(process.cwd(), 'image-cache'),
		maxBytes: parseNonNegativeInteger(process.env.IMAGE_CACHE_MAX_BYTES, 1024 * 1024 * 1024),
		maxAgeMs:
			parseNonNegativeInteger(process.env.IMAGE_CACHE_MAX_AGE_SECONDS, 30 * 24 * 60 * 60) * 1000,
		cleanupIntervalMs:
			parseNonNegativeInteger(process.env.IMAGE_CACHE_CLEANUP_INTERVAL_SECONDS, 60 * 60) * 1000
	};
}

export const createImageVariantCacheKey = (
	imageId: string,
	width: string | number,
	format: string
) => {
	const imageHash = createHash('sha256').update(imageId).digest('base64url');
	return `${CACHE_VERSION}/${imageHash.slice(0, 2)}/${imageHash}-w${width}.${format}`;
};

const createImageCachePrefix = (imageId: string) => {
	const imageHash = createHash('sha256').update(imageId).digest('base64url');
	return `${CACHE_VERSION}/${imageHash.slice(0, 2)}/${imageHash}-w`;
};

export function beginImageCacheLease(imageId: string): ImageCacheLease {
	const cachePrefix = createImageCachePrefix(imageId);
	const state = imageCacheStates.get(cachePrefix) ?? { generation: 0, leases: 0 };
	state.leases += 1;
	imageCacheStates.set(cachePrefix, state);
	let released = false;

	return {
		cachePrefix,
		generation: state.generation,
		release: () => {
			if (released) return;
			released = true;
			state.leases -= 1;
			if (state.leases === 0 && imageCacheStates.get(cachePrefix) === state) {
				imageCacheStates.delete(cachePrefix);
			}
		}
	};
}

const isLeaseCurrent = (cacheKey: string, lease?: ImageCacheLease) => {
	if (!lease) return true;
	const state = imageCacheStates.get(lease.cachePrefix);
	return (
		cacheKey.startsWith(lease.cachePrefix) &&
		state !== undefined &&
		state.generation === lease.generation
	);
};

const resolveCachePath = (cacheKey: string) => {
	const root = path.resolve(getImageCacheConfig().directory);
	const cachePath = path.resolve(root, cacheKey);
	if (!cachePath.startsWith(`${root}${path.sep}`)) {
		throw new Error('Invalid image cache key');
	}
	return cachePath;
};

export async function readCachedImageVariant(cacheKey: string) {
	const cachePath = resolveCachePath(cacheKey);

	try {
		const [buffer, fileStat] = await Promise.all([readFile(cachePath), stat(cachePath)]);
		if (!fileStat.isFile() || buffer.byteLength === 0) {
			await unlink(cachePath).catch(() => {});
			return null;
		}
		return { buffer, fileStat };
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
		throw error;
	}
}

export async function writeCachedImageVariant(
	cacheKey: string,
	buffer: Buffer,
	lease?: ImageCacheLease
) {
	const { maxBytes } = getImageCacheConfig();
	if ((maxBytes > 0 && buffer.byteLength > maxBytes) || !isLeaseCurrent(cacheKey, lease)) {
		return false;
	}

	const cachePath = resolveCachePath(cacheKey);
	await mkdir(path.dirname(cachePath), { recursive: true });
	const temporaryPath = path.join(
		path.dirname(cachePath),
		`.${path.basename(cachePath)}.${process.pid}.${randomUUID()}.tmp`
	);

	try {
		await writeFile(temporaryPath, buffer, { flag: 'wx', mode: 0o600 });
		if (!isLeaseCurrent(cacheKey, lease)) return false;
		await rename(temporaryPath, cachePath);
	} finally {
		await unlink(temporaryPath).catch((error: NodeJS.ErrnoException) => {
			if (error.code !== 'ENOENT') throw error;
		});
	}

	scheduleImageCacheEviction();
	return true;
}

export function deduplicateCacheGeneration<T>(cacheKey: string, operation: () => Promise<T>) {
	const existing = inFlight.get(cacheKey) as Promise<T> | undefined;
	if (existing) return existing;

	const promise = operation().finally(() => inFlight.delete(cacheKey));
	inFlight.set(cacheKey, promise);
	return promise;
}

const collectEntries = async (directory: string): Promise<CacheEntry[]> => {
	let entries;
	try {
		entries = await readdir(directory, { withFileTypes: true });
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
		throw error;
	}

	const collected: CacheEntry[] = [];
	for (const entry of entries) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			collected.push(...(await collectEntries(entryPath)));
		} else if (entry.isFile()) {
			const fileStat = await stat(entryPath).catch((error: NodeJS.ErrnoException) => {
				if (error.code === 'ENOENT') return null;
				throw error;
			});
			if (fileStat) {
				collected.push({ cachePath: entryPath, size: fileStat.size, mtimeMs: fileStat.mtimeMs });
			}
		}
	}
	return collected;
};

export function evictImageCache() {
	if (evictionPromise) return evictionPromise;

	evictionPromise = (async () => {
		const config = getImageCacheConfig();
		const now = Date.now();
		let entries = await collectEntries(config.directory);
		let expiredFiles = 0;
		let expiredBytes = 0;

		for (const entry of entries) {
			const isTemporary = entry.cachePath.endsWith('.tmp');
			const isExpired = config.maxAgeMs > 0 && now - entry.mtimeMs > config.maxAgeMs;
			if ((isTemporary && now - entry.mtimeMs > 60 * 60 * 1000) || isExpired) {
				await unlink(entry.cachePath).catch((error: NodeJS.ErrnoException) => {
					if (error.code !== 'ENOENT') throw error;
				});
				expiredFiles += 1;
				expiredBytes += entry.size;
			}
		}

		entries = entries.filter(
			(entry) =>
				!entry.cachePath.endsWith('.tmp') &&
				!(config.maxAgeMs > 0 && now - entry.mtimeMs > config.maxAgeMs)
		);
		let bytes = entries.reduce((total, entry) => total + entry.size, 0);

		if (config.maxBytes > 0 && bytes > config.maxBytes) {
			entries.sort((left, right) => left.mtimeMs - right.mtimeMs);
			for (const entry of entries) {
				if (bytes <= config.maxBytes * 0.9) break;
				await unlink(entry.cachePath).catch((error: NodeJS.ErrnoException) => {
					if (error.code !== 'ENOENT') throw error;
				});
				bytes -= entry.size;
			}
		}

		const remaining = await collectEntries(config.directory);
		const byExtension: CacheStats['byExtension'] = {};
		for (const entry of remaining) {
			if (entry.cachePath.endsWith('.tmp')) continue;
			const extension = path.extname(entry.cachePath).slice(1) || 'unknown';
			const current = byExtension[extension] ?? { files: 0, bytes: 0 };
			current.files += 1;
			current.bytes += entry.size;
			byExtension[extension] = current;
		}

		return {
			files: Object.values(byExtension).reduce((total, value) => total + value.files, 0),
			bytes: Object.values(byExtension).reduce((total, value) => total + value.bytes, 0),
			expiredFiles,
			expiredBytes,
			byExtension
		};
	})().finally(() => {
		evictionPromise = null;
	});

	return evictionPromise;
}

export async function collectImageCacheStats() {
	const entries = await collectEntries(getImageCacheConfig().directory);
	const byExtension: CacheStats['byExtension'] = {};
	for (const entry of entries) {
		if (entry.cachePath.endsWith('.tmp')) continue;
		const extension = path.extname(entry.cachePath).slice(1) || 'unknown';
		const current = byExtension[extension] ?? { files: 0, bytes: 0 };
		current.files += 1;
		current.bytes += entry.size;
		byExtension[extension] = current;
	}
	return {
		files: Object.values(byExtension).reduce((total, value) => total + value.files, 0),
		bytes: Object.values(byExtension).reduce((total, value) => total + value.bytes, 0),
		byExtension
	};
}

export async function invalidateImageVariants(imageId: string) {
	const cachePrefix = createImageCachePrefix(imageId);
	const state = imageCacheStates.get(cachePrefix) ?? { generation: 0, leases: 0 };
	state.generation += 1;
	imageCacheStates.set(cachePrefix, state);

	await Promise.all(
		[...inFlight.entries()]
			.filter(([cacheKey]) => cacheKey.startsWith(cachePrefix))
			.map(([, generation]) => generation.catch(() => undefined))
	);

	const directory = path.dirname(resolveCachePath(cachePrefix));
	const filePrefix = path.basename(cachePrefix);
	let entries;
	try {
		entries = await readdir(directory, { withFileTypes: true });
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			if (state.leases === 0 && imageCacheStates.get(cachePrefix) === state) {
				imageCacheStates.delete(cachePrefix);
			}
			return;
		}
		throw error;
	}

	await Promise.all(
		entries
			.filter((entry) => entry.isFile() && entry.name.startsWith(filePrefix))
			.map((entry) =>
				unlink(path.join(directory, entry.name)).catch((error: NodeJS.ErrnoException) => {
					if (error.code !== 'ENOENT') throw error;
				})
			)
	);

	if (state.leases === 0 && imageCacheStates.get(cachePrefix) === state) {
		imageCacheStates.delete(cachePrefix);
	}
}

function scheduleImageCacheEviction() {
	if (scheduledEviction) return;
	scheduledEviction = setTimeout(() => {
		scheduledEviction = null;
		void evictImageCache().catch((error) => console.error('Image cache eviction failed', error));
	}, 1_000);
	scheduledEviction.unref();
}

export function startImageCacheMaintenance() {
	if (maintenanceStarted) return;
	maintenanceStarted = true;
	const { cleanupIntervalMs } = getImageCacheConfig();
	if (cleanupIntervalMs <= 0) return;

	const initialCleanup = setTimeout(
		() => {
			void evictImageCache().catch((error) => console.error('Image cache eviction failed', error));
		},
		Math.min(10_000, cleanupIntervalMs)
	);
	initialCleanup.unref();

	const cleanupTimer = setInterval(() => {
		void evictImageCache().catch((error) => console.error('Image cache eviction failed', error));
	}, cleanupIntervalMs);
	cleanupTimer.unref();
}
