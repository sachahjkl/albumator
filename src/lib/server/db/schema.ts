import { relations } from 'drizzle-orm';
import { blob, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Table TS types

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Image = typeof image.$inferSelect;
export type Share = typeof share.$inferSelect;

export type Metadata = {
	dateTaken: Date;
};

export type Preferences = {
	size?: string;
};

// Table definitions

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	preferences: text('preferences', { mode: 'json' }).$type<Preferences>()
});

export const roles = sqliteTable('roles', {
	id: text('id').primaryKey(),
	name: text('name').notNull().unique()
});

export const userRoles = sqliteTable(
	'user_roles',
	{
		userId: text('user_id').notNull(),
		roleId: text('role_id').notNull()
	},

	(t) => ({
		pk: primaryKey({ columns: [t.userId, t.roleId] })
	})
);

export const userRelations = relations(user, ({ many }) => ({
	images: many(image),
	shares: many(share),
	sessions: many(session),
	roles: many(roles),
	inviteCodes: many(inviteCode)
}));

export const inviteCode = sqliteTable('invite_code', {
	id: text('id').primaryKey(),
	code: text('code').notNull().unique(),
	userId: text('user_id')
		.references(() => user.id, {
			onDelete: 'cascade'
		})
		.notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const inviteCodeRelations = relations(inviteCode, ({ one }) => ({
	user: one(user, {
		fields: [inviteCode.userId],
		references: [user.id]
	})
}));

export const share = sqliteTable('share', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	userId: text('user_id')
		.references(() => user.id, {
			onDelete: 'cascade'
		})
		.notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' })
});

export const shareRelations = relations(share, ({ many }) => ({
	images: many(shareToImages)
}));

export const shareToImages = sqliteTable(
	'share_to_images',
	{
		shareId: text('share_id')
			.references(() => share.id, {
				onDelete: 'cascade'
			})
			.notNull(),
		imageId: text('image_id')
			.references(() => image.id, {
				onDelete: 'cascade'
			})
			.notNull()
	},
	(t) => ({
		pk: primaryKey({ columns: [t.shareId, t.imageId] })
	})
);

export const shareToImageRelations = relations(shareToImages, ({ one }) => ({
	share: one(share, {
		fields: [shareToImages.shareId],
		references: [share.id]
	}),
	image: one(image, {
		fields: [shareToImages.imageId],
		references: [image.id]
	})
}));

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.references(() => user.id, {
			onDelete: 'cascade'
		})
		.notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

// TODO: add tagging of images (idea is that the search filter will be a combination of tags and keywords)
export const image = sqliteTable('image', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	path: text('path').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	metadata: text('metadata', { mode: 'json' }).notNull().$type<Metadata>(),
	userId: text('user_id')
		.references(() => user.id, {
			onDelete: 'cascade'
		})
		.notNull(),
	mimeType: text('mime_type').notNull(),
	blob: blob('blob', { mode: 'buffer' }).notNull()
});

export const imageRelations = relations(image, ({ one, many }) => ({
	user: one(user, {
		fields: [image.userId],
		references: [user.id]
	}),
	shares: many(shareToImages)
}));
