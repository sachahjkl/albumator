import { sql, type SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

export const sqlJSON = <TC extends SQLiteColumn, TD = Exclude<TC['default'], SQL<unknown>>>(
	column: TC,
	data: TD
) => {
	return sql`${JSON.stringify(data)}::json`;
};
