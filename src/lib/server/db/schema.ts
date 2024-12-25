import { relations } from 'drizzle-orm';
import { blob, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Table TS types

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Image = typeof image.$inferSelect;
export type Share = typeof share.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type UserLimits = typeof userLimits.$inferSelect;

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
	preferences: text('preferences', { mode: 'json' }).$type<Preferences>(),
	usedInviteId: text('usedInvite_id')
});

export const roles = sqliteTable('roles', {
	id: text('id').primaryKey(),
	name: text('name').notNull().unique()
});

export const roleRelations = relations(roles, ({ many }) => ({
	users: many(userRoles, {
		relationName: 'userRoles'
	})
}));

export const userRoles = sqliteTable(
	'user_roles',
	{
		userId: text('user_id')
			.references(() => user.id, {
				onDelete: 'cascade'
			})
			.notNull(),
		roleId: text('role_id')
			.references(() => roles.id, {
				onDelete: 'cascade'
			})
			.notNull()
	},

	(t) => ({
		pk: primaryKey({ columns: [t.userId, t.roleId] })
	})
);

export const userRelations = relations(user, ({ many, one }) => ({
	images: many(image),
	shares: many(share),
	sessions: many(session),
	roles: many(roles, {
		relationName: 'userRoles'
	}),
	inviteCodes: many(inviteCode, { relationName: 'owner' }),
	usedInvite: one(inviteCode, {
		fields: [user.usedInviteId],
		references: [inviteCode.id],
		relationName: 'usedInvite'
	}),
	limits: one(userLimits, {
		fields: [user.id],
		references: [userLimits.userId],
		relationName: 'limits'
	})
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

export const inviteCodeRelations = relations(inviteCode, ({ one, many }) => ({
	owner: one(user, {
		fields: [inviteCode.userId],
		references: [user.id],
		relationName: ''
	}),
	invitedUsers: many(user, {
		relationName: 'usedInvite'
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

export const shareRelations = relations(share, ({ many, one }) => ({
	images: many(shareToImages),
	user: one(user, {
		fields: [share.userId],
		references: [user.id]
	})
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

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	})
}));

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

export const DEMO_USER = {
	id: 'demo',
	username: 'demo',
	password: 'demo',
	limits: {
		invites: 0,
		shares: 50,
		images: 150
	}
};

export const DEFAULT_USER_LIMITS = {
	invites: 0,
	shares: 1000,
	images: 1000
};

export const userLimits = sqliteTable('user_limits', {
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	invites: integer('invites', { mode: 'number' }).notNull().default(DEFAULT_USER_LIMITS.invites),
	shares: integer('shares', { mode: 'number' }).notNull().default(DEFAULT_USER_LIMITS.shares),
	images: integer('images', { mode: 'number' }).notNull().default(DEFAULT_USER_LIMITS.images)
});

export const userLimitsRelations = relations(userLimits, ({ one }) => ({
	user: one(user, {
		fields: [userLimits.userId],
		references: [user.id]
	})
}));
