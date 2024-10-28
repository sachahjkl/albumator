import { db } from '$lib/server/db';
import * as table from '$lib/server/db/schema';
import { and, desc, eq, getTableColumns } from 'drizzle-orm';
import { generateId } from '../crypto';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { blob, ...ImageColumns } = getTableColumns(table.image);

export type UserImage = Awaited<ReturnType<typeof getUserImages>>[0];


export const getUserImageBuffer = async (userId: string, imageId: string) => {
	return await db.query.image.findFirst({
		where: and(eq(table.image.userId, userId), eq(table.image.id, imageId))
	});
};

export const getUserImages = async (userId: string, page = 1, pageSize = 10) => {
	const offset = (page - 1) * pageSize;
	console.log('getting user images', { offset, page, pageSize, id: userId });
	return await db
		.select(ImageColumns)
		.from(table.image)
		.where(eq(table.image.userId, userId))
		.orderBy(desc(table.image.createdAt))
		.offset(offset)
		.limit(pageSize);
};

export type NewImage = Omit<typeof table.image.$inferInsert, 'createdAt' | 'id'>;

export const insertImage = async (newImage: NewImage) => {
	console.info('adding image', { newImage });
	return db
		.insert(table.image)
		.values({
			id: generateId(),
			createdAt: new Date(),
			...newImage
		})
		.returning(ImageColumns);
};
