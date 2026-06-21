import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { getImageCacheDir } from './index';

type CacheStats = {
	files: number;
	bytes: number;
	byExtension: Record<string, { files: number; bytes: number }>;
};

async function collectStats(directory: string): Promise<CacheStats> {
	const totals: CacheStats = {
		files: 0,
		bytes: 0,
		byExtension: {}
	};

	try {
		const entries = await readdir(directory, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(directory, entry.name);

			if (entry.isDirectory()) {
				const nested = await collectStats(fullPath);
				totals.files += nested.files;
				totals.bytes += nested.bytes;

				for (const [extension, stats] of Object.entries(nested.byExtension)) {
					const current = totals.byExtension[extension] ?? { files: 0, bytes: 0 };
					current.files += stats.files;
					current.bytes += stats.bytes;
					totals.byExtension[extension] = current;
				}

				continue;
			}

			if (!entry.isFile()) {
				continue;
			}

			const fileStat = await stat(fullPath);
			const extension = path.extname(entry.name).slice(1) || 'unknown';

			totals.files += 1;
			totals.bytes += fileStat.size;

			const current = totals.byExtension[extension] ?? { files: 0, bytes: 0 };
			current.files += 1;
			current.bytes += fileStat.size;
			totals.byExtension[extension] = current;
		}
	} catch {
		return totals;
	}

	return totals;
}

const cacheDir = getImageCacheDir();
const stats = await collectStats(cacheDir);

console.log(JSON.stringify({ cacheDir, ...stats }, null, 2));
