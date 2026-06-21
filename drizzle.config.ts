import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL ?? 'file:local.db';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',

	dbCredentials: {
		url: databaseUrl
	},
	out: './src/lib/server/db/migrations',
	migrations: {
		table: 'drizzle_migrations'
	},

	verbose: true,
	strict: true,
	dialect: 'sqlite'
});
