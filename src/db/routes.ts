// src/db/routes.ts
import { db } from './index.ts';
import { routes, users } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export interface CreateRouteInput {
  creatorUid: string;
  title: string;
  distanceKm: number;
  difficulty: string; // 'Easy' | 'Moderate' | 'Challenging' | 'Epic'
  startLocation: string;
  description?: string;
  terrain?: string;
  elevationMeters?: number;
}

export async function getAllRoutes() {
  try {
    const res = await db
      .select({
        id: routes.id,
        creatorUid: routes.creatorUid,
        title: routes.title,
        distanceKm: routes.distanceKm,
        difficulty: routes.difficulty,
        startLocation: routes.startLocation,
        description: routes.description,
        terrain: routes.terrain,
        elevationMeters: routes.elevationMeters,
        createdAt: routes.createdAt,
        creatorName: users.displayName,
        creatorAvatar: users.avatarUrl,
      })
      .from(routes)
      .leftJoin(users, eq(routes.creatorUid, users.uid))
      .orderBy(desc(routes.createdAt));

    return res.map((r) => ({
      ...r,
      distanceKm: Number(r.distanceKm),
    }));
  } catch (error) {
    console.error('Failed to get routes from Cloud SQL:', error);
    throw new Error('Could not fetch routes', { cause: error });
  }
}

export async function createNewRoute(input: CreateRouteInput) {
  try {
    const result = await db
      .insert(routes)
      .values({
        creatorUid: input.creatorUid,
        title: input.title,
        distanceKm: input.distanceKm.toFixed(2),
        difficulty: input.difficulty || 'Moderate',
        startLocation: input.startLocation,
        description: input.description || null,
        terrain: input.terrain || 'Road',
        elevationMeters: input.elevationMeters || 20,
      })
      .returning();

    return {
      ...result[0],
      distanceKm: Number(result[0].distanceKm),
    };
  } catch (error) {
    console.error('Failed to create route in Cloud SQL:', error);
    throw new Error('Failed to save route', { cause: error });
  }
}

export async function deleteRouteById(id: number, userUid: string) {
  try {
    const target = await db.select().from(routes).where(eq(routes.id, id)).limit(1);
    if (target.length === 0) {
      return { notFound: true };
    }
    if (target[0].creatorUid !== userUid) {
      return { forbidden: true };
    }

    await db.delete(routes).where(eq(routes.id, id));
    return { success: true };
  } catch (error) {
    console.error('Failed to delete route:', error);
    throw new Error('Failed to delete route', { cause: error });
  }
}
