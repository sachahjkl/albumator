import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, count, desc, eq, sql } from 'drizzle-orm';
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

const getUserImagesQuery = db
	.select(LightImageColumns)
	.from(table.image)
	.where(eq(table.image.userId, sql.placeholder('userId')))
	.orderBy(desc(table.image.createdAt))
	.offset(sql.placeholder('offset'))
	.limit(sql.placeholder('limit'))
	.prepare();

export const getUserImages = (userId: UserId, page = 1, pageSize = 10) => {
	const offset = (page - 1) * pageSize;
	console.log('getting user images', { offset, page, pageSize, id: userId });
	return getUserImagesQuery.execute({
		userId,
		offset,
		limit: pageSize
	});
};

export type NewImage = Omit<typeof table.image.$inferInsert, 'createdAt' | 'id'>;

export const insertImage = (newImage: NewImage) => {
	const { blob, ...rest } = newImage;
	console.info('adding image', { rest });
	return db
		.insert(table.image)
		.values({
			id: generateId(),
			createdAt: new Date(),
			...newImage
		})
		.returning(LightImageColumns);
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
	.prepare();

export const getUserShares = (userId: UserId) => {
	return getUserSharesQuery.execute({
		userId
	});
};

const getShareImagesQuery = db.query.share
	.findFirst({
		with: {
			images: {
				columns: {
					imageId: false,
					shareId: false
				},
				with: {
					image: {
						columns: {
							blob: false
						}
					}
				}
			}
		},
		where: eq(table.share.id, sql.placeholder('shareId'))
	})
	.prepare();

export const getShare = (shareId: ShareId) => {
	return getShareImagesQuery.execute({
		shareId
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
	.where(eq(table.share.id, sql.placeholder('shareId')))
	.prepare();

export const deleteShare = (shareId: ShareId) => {
	return deleteShareQuery.execute({
		shareId
	});
};
