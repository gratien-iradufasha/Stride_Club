// src/db/users.ts
import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export interface UserSyncData {
  uid: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  paceGroup?: string;
  bio?: string;
}

export async function getOrCreateUser(data: UserSyncData) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, data.uid)).limit(1);
    if (existing.length > 0) {
      if (data.displayName || data.avatarUrl) {
        const updated = await db
          .update(users)
          .set({
            displayName: data.displayName || existing[0].displayName,
            avatarUrl: data.avatarUrl || existing[0].avatarUrl,
            email: data.email || existing[0].email,
          })
          .where(eq(users.uid, data.uid))
          .returning();
        return updated[0];
      }
      return existing[0];
    }

    const inserted = await db
      .insert(users)
      .values({
        uid: data.uid,
        email: data.email,
        displayName: data.displayName || 'Runner',
        avatarUrl: data.avatarUrl || null,
        paceGroup: data.paceGroup || 'Intermediate (5:30/km)',
        bio: data.bio || 'Club runner looking forward to the next long run!',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: data.email,
          displayName: data.displayName || 'Runner',
          avatarUrl: data.avatarUrl || null,
        },
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Failed to get or create user in Cloud SQL:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}

export async function getUserProfile(uid: string) {
  try {
    const res = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return res[0] || null;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    throw new Error('Failed to retrieve user profile', { cause: error });
  }
}
