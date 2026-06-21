import { createClient } from '@libsql/client';
import * as table from '$lib/server/db/schema';
import { deriveImageData } from './index';
import { drizzle } from 'drizzle-orm/libsql';
import { eq, or } from 'drizzle-orm';

const client = createClient({ url: process.env.DATABASE_URL ?? 'file:local.db' });
const db = drizzle(client, { schema: table });

async function main() {
	const images = await db
		.select({
			id: table.image.id,
			blob: table.image.blob
		})
		.from(table.image)
		.where(or(eq(table.image.thumbHash, ''), eq(table.image.width, 0), eq(table.image.height, 0)));

	for (const image of images) {
		const derived = await deriveImageData(image.blob);
		await db.update(table.image).set(derived).where(eq(table.image.id, image.id));
	}

	console.log(`Backfilled ${images.length} image placeholders.`);
}

await main();
