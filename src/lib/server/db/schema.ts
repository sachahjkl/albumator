import { relations } from 'drizzle-orm';
import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	preferences: text('preferences', { mode: 'json' })
});

export const userRelations = relations(user, ({ many }) => ({
	images: many(image)
}));

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export type Metadata = {
	dateTaken: Date;
};

export const image = sqliteTable('image', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	path: text('path').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	metadata: text('metadata', { mode: 'json' }).notNull().$type<Metadata>(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	mimeType: text('mime_type').notNull(),
	blob: blob('blob', { mode: 'buffer' }).notNull()
});

export type Session = typeof session.$inferSelect;

export type User = typeof user.$inferSelect;

export type Image = typeof image.$inferSelect;
