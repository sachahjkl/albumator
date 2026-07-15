import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { fileURLToPath } from 'node:url';

const migrationsFolder = fileURLToPath(
	new URL('../src/lib/server/db/migrations/', import.meta.url)
);
const client = createClient({
	url: process.env.DATABASE_URL ?? 'file:local.db'
});

try {
	await migrate(drizzle(client), {
		migrationsFolder,
		migrationsTable: 'drizzle_migrations'
	});
} finally {
	client.close();
}

if (process.argv.includes('--start')) {
	await import('../build/index.js');
}
