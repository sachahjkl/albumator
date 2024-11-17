import { SUPPORTED_IMAGE_FORMATS } from '$lib/constants';
import { db } from '$lib/server/db';
import type { Preferences } from '$lib/server/db/schema';
import * as table from '$lib/server/db/schema';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import imageType from 'image-type';
import { generateId } from '../crypto';

const LightImageColumns = {
	id: table.image.id,
	name: table.image.name,
	path: table.image.path,
	createdAt: table.image.createdAt,
	metadata: table.image.metadata,
	mimeType: table.image.mimeType
};

export type LightImage = Omit<table.Image, 'blob' | 'userId'>;
export type ImageId = table.Image['id'];
export type UserId = table.User['id'];
export type ShareId = table.Share['id'];
export type NewShare = Omit<typeof table.share.$inferInsert, 'id' | 'createdAt'>;

const userAndImageIdMatch = and(
	eq(table.image.userId, sql.placeholder('userId')),
	eq(table.image.id, sql.placeholder('imageId'))
);

const getUserImageBufferQuery = db.query.image
	.findFirst({
		where: userAndImageIdMatch
	})
	.prepare();

export const getUserImageBuffer = (userId: UserId, imageId: ImageId) => {
	return getUserImageBufferQuery.execute({
		userId,
		imageId
	});
};

const getSharedImageBufferQuery = db
	.select()
	.from(table.shareToImages)
	.innerJoin(table.image, eq(table.shareToImages.imageId, table.image.id))
	.where(
		and(
			eq(table.shareToImages.shareId, sql.placeholder('shareId')),
			eq(table.image.id, sql.placeholder('imageId'))
		)
	)
	.prepare();

export const getSharedImageBuffer = (shareId: UserId, imageId: ImageId) => {
	return getSharedImageBufferQuery
		.execute({
			shareId,
			imageId
		})
		.then((result) => result.at(0)?.image);
};

const getUserImagesQuery = db
	.select(LightImageColumns)
	.from(table.image)
	.where(eq(table.image.userId, sql.placeholder('userId')))
	.orderBy(desc(table.image.createdAt))
	.offset(sql.placeholder('offset'))
	.limit(sql.placeholder('limit'))
	.prepare();

export const getUserImages = (userId: UserId, page = 1, pageSize = 30) => {
	const offset = (page - 1) * pageSize;
	return getUserImagesQuery.execute({
		userId,
		offset,
		limit: pageSize
	});
};

export type NewImage = Omit<typeof table.image.$inferInsert, 'createdAt' | 'id'>;

export type InsertedImage = Awaited<ReturnType<typeof insertImages>>[number];

export const insertImages = (newImages: NewImage[]) => {
	const images = newImages
		.map((newImage) => {
			const { blob, ...rest } = newImage;
			return {
				id: generateId(),
				createdAt: new Date(),
				...newImage
			};
		})
		.filter((image) =>
			SUPPORTED_IMAGE_FORMATS.map((supported) => supported.ext).includes(
				image.name.split('.')[1] ?? 'not splittable'
			)
		)
		.filter(
			async (image) =>
				await imageType(image.blob).then((type) =>
					SUPPORTED_IMAGE_FORMATS.find(
						(supported) => supported.mime === type?.mime && supported.ext === type?.ext
					)
				)
		);
	if (images.length === 0) {
		throw new Error(
			`No supported images (${SUPPORTED_IMAGE_FORMATS.map((supported) => supported.ext).join(', ')})`
		);
	}
	return db.insert(table.image).values(images).returning(LightImageColumns);
};

const deleteImageQuery = db.delete(table.image).where(userAndImageIdMatch).prepare();

export const deleteImage = (imageId: string, userId: string) => {
	return deleteImageQuery.execute({
		imageId,
		userId
	});
};

const getUserSharesQuery = db
	.select({
		id: table.share.id,
		title: table.share.title,
		createdAt: table.share.createdAt,
		expiresAt: table.share.expiresAt,
		imagesCount: count(table.shareToImages.imageId)
	})
	.from(table.share)
	.innerJoin(table.shareToImages, eq(table.share.id, table.shareToImages.shareId))
	.where(eq(table.share.userId, sql.placeholder('userId')))
	.orderBy(desc(table.share.createdAt))
	.groupBy(table.share.id)
	.prepare();

export const getUserShares = (userId: UserId) => {
	return getUserSharesQuery.execute({
		userId
	});
};

const getShareQuery = db
	.select()
	.from(table.share)
	.where(eq(table.share.id, sql.placeholder('shareId')))
	.prepare();

export const getShare = async (shareId: ShareId, page = 1, pageSize = 30) => {
	const share = await getShareQuery
		.execute({
			shareId
		})
		.then((result) => result.at(0));

	if (!share) {
		throw new Error('Share not found');
	}

	return {
		...share,
		images: await getShareImages(shareId, page, pageSize)
	};
};

const getShareImagesQuery = db
	.select(LightImageColumns)
	.from(table.image)
	.innerJoin(table.shareToImages, eq(table.image.id, table.shareToImages.imageId))
	.where(eq(table.shareToImages.shareId, sql.placeholder('shareId')))
	.orderBy(desc(table.image.createdAt))
	.offset(sql.placeholder('offset'))
	.limit(sql.placeholder('limit'))
	.prepare();

export const getShareImages = async (shareId: ShareId, page = 1, pageSize = 30) => {
	const offset = (page - 1) * pageSize;
	return getShareImagesQuery.execute({
		shareId,
		offset,
		limit: pageSize
	});
};

export const newShare = async (newShare: NewShare, images: ImageId[]) => {
	if (images.length == 0) {
		throw new Error('No images provided');
	}

	// Expires in 7 days by default
	// const defaultExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

	const [result] = await db
		.insert(table.share)
		.values({
			id: generateId(),
			createdAt: new Date(),
			expiresAt: newShare.expiresAt,
			...newShare
		})
		.returning({
			shareId: table.share.id
		});

	const shareToImages = images.map((imageId) => ({
		shareId: result.shareId,
		imageId
	}));

	await db.insert(table.shareToImages).values(shareToImages);
	return result;
};

const deleteShareQuery = db
	.delete(table.share)
	.where(
		and(
			eq(table.share.id, sql.placeholder('shareId')),
			eq(table.share.userId, sql.placeholder('userId'))
		)
	)
	.prepare();

export const deleteShare = (shareId: ShareId) => {
	return deleteShareQuery.execute({
		shareId
	});
};

const getUserPreferencesQuery = db
	.select({
		preferences: table.user.preferences
	})
	.from(table.user)
	.where(eq(table.user.id, sql.placeholder('userId')))
	.prepare();

export const getUserPreferences = (userId: UserId) => {
	return getUserPreferencesQuery
		.execute({
			userId
		})
		.then((result) => result.at(0)?.preferences);
};

export const updateUserPreferences = async (userId: UserId, preferences: Preferences) => {
	const previousPreferences = await getUserPreferences(userId);
	// merge previous preferences with new ones
	if (previousPreferences) {
		preferences = {
			...previousPreferences,
			...preferences
		};
	}

	return db
		.update(table.user)
		.set({
			preferences
		})
		.where(eq(table.user.id, sql.placeholder('userId')))
		.returning({
			preferences: table.user.preferences
		})
		.prepare()
		.execute({
			userId
		})
		.then((result) => result.at(0)?.preferences);
};
