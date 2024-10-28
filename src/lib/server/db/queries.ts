import * as table from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { asc, desc, eq } from 'drizzle-orm';
import { generateId } from '../crypto';

const CommonColumns = {
	id: table.image.id,
	name: table.image.name,
	path: table.image.path,
	createdAt: table.image.createdAt,
	metadata: table.image.metadata,
	mimeType: table.image.mimeType
};

export const getUserImages = async (userId: string, page = 1, pageSize = 10) => {
	const offset = (page - 1) * pageSize;
	console.log('getting user images', { offset, page, pageSize, id: userId });
	return await db
		.select(CommonColumns)
		.from(table.image)
		.where(eq(table.image.userId, userId))
		.orderBy(asc(table.image.createdAt))
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
		.returning(CommonColumns);
};
