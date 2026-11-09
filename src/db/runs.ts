// src/db/runs.ts
import { db } from './index.ts';
import { runs, users, runRsvps, runComments } from './schema.ts';
import { eq, desc, and, sql } from 'drizzle-orm';

export interface CreateRunInput {
  creatorUid: string;
  title: string;
  description: string;
  distanceKm: number;
  paceCategory: string;
  targetPace: string;
  runDate: string; // YYYY-MM-DD
  runTime: string; // HH:MM
  locationName: string;
  locationAddress: string;
  terrain?: string;
  maxParticipants?: number;
  postRunSocial?: string;
  gearNotes?: string;
  elevationMeters?: number;
}

export async function getAllRuns() {
  try {
    const allRuns = await db
      .select({
        id: runs.id,
        creatorUid: runs.creatorUid,
        title: runs.title,
        description: runs.description,
        distanceKm: runs.distanceKm,
        paceCategory: runs.paceCategory,
        targetPace: runs.targetPace,
        runDate: runs.runDate,
        runTime: runs.runTime,
        locationName: runs.locationName,
        locationAddress: runs.locationAddress,
        terrain: runs.terrain,
        maxParticipants: runs.maxParticipants,
        postRunSocial: runs.postRunSocial,
        gearNotes: runs.gearNotes,
        elevationMeters: runs.elevationMeters,
        createdAt: runs.createdAt,
        creatorName: users.displayName,
        creatorAvatar: users.avatarUrl,
        creatorEmail: users.email,
      })
      .from(runs)
      .leftJoin(users, eq(runs.creatorUid, users.uid))
      .orderBy(runs.runDate, runs.runTime);

    // Fetch RSVPs and comment counts for each run
    const rsvps = await db
      .select({
        id: runRsvps.id,
        runId: runRsvps.runId,
        userUid: runRsvps.userUid,
        status: runRsvps.status,
        paceNote: runRsvps.paceNote,
        userName: users.displayName,
        userAvatar: users.avatarUrl,
      })
      .from(runRsvps)
      .leftJoin(users, eq(runRsvps.userUid, users.uid));

    const comments = await db
      .select({
        id: runComments.id,
        runId: runComments.runId,
        userUid: runComments.userUid,
        authorName: runComments.authorName,
        authorAvatar: runComments.authorAvatar,
        message: runComments.message,
        createdAt: runComments.createdAt,
      })
      .from(runComments)
      .orderBy(runComments.createdAt);

    return allRuns.map((run) => {
      const runRsvpsList = rsvps.filter((r) => r.runId === run.id);
      const runCommentsList = comments.filter((c) => c.runId === run.id);
      return {
        ...run,
        distanceKm: Number(run.distanceKm),
        rsvps: runRsvpsList,
        attendeeCount: runRsvpsList.filter((r) => r.status === 'going').length,
        comments: runCommentsList,
        commentsCount: runCommentsList.length,
      };
    });
  } catch (error) {
    console.error('Failed to get runs from Cloud SQL:', error);
    throw new Error('Could not fetch runs', { cause: error });
  }
}

export async function getRunDetails(id: number) {
  try {
    const runResult = await db
      .select({
        id: runs.id,
        creatorUid: runs.creatorUid,
        title: runs.title,
        description: runs.description,
        distanceKm: runs.distanceKm,
        paceCategory: runs.paceCategory,
        targetPace: runs.targetPace,
        runDate: runs.runDate,
        runTime: runs.runTime,
        locationName: runs.locationName,
        locationAddress: runs.locationAddress,
        terrain: runs.terrain,
        maxParticipants: runs.maxParticipants,
        postRunSocial: runs.postRunSocial,
        gearNotes: runs.gearNotes,
        elevationMeters: runs.elevationMeters,
        createdAt: runs.createdAt,
        creatorName: users.displayName,
        creatorAvatar: users.avatarUrl,
        creatorEmail: users.email,
        creatorBio: users.bio,
      })
      .from(runs)
      .leftJoin(users, eq(runs.creatorUid, users.uid))
      .where(eq(runs.id, id))
      .limit(1);

    if (runResult.length === 0) {
      return null;
    }

    const run = runResult[0];

    const rsvps = await db
      .select({
        id: runRsvps.id,
        runId: runRsvps.runId,
        userUid: runRsvps.userUid,
        status: runRsvps.status,
        paceNote: runRsvps.paceNote,
        createdAt: runRsvps.createdAt,
        userName: users.displayName,
        userAvatar: users.avatarUrl,
      })
      .from(runRsvps)
      .leftJoin(users, eq(runRsvps.userUid, users.uid))
      .where(eq(runRsvps.runId, id));

    const comments = await db
      .select({
        id: runComments.id,
        runId: runComments.runId,
        userUid: runComments.userUid,
        authorName: runComments.authorName,
        authorAvatar: runComments.authorAvatar,
        message: runComments.message,
        createdAt: runComments.createdAt,
      })
      .from(runComments)
      .where(eq(runComments.runId, id))
      .orderBy(runComments.createdAt);

    return {
      ...run,
      distanceKm: Number(run.distanceKm),
      rsvps,
      attendeeCount: rsvps.filter((r) => r.status === 'going').length,
      comments,
      commentsCount: comments.length,
    };
  } catch (error) {
    console.error(`Failed to get run details for #${id}:`, error);
    throw new Error('Could not fetch run details', { cause: error });
  }
}

export async function createNewRun(input: CreateRunInput) {
  try {
    const result = await db
      .insert(runs)
      .values({
        creatorUid: input.creatorUid,
        title: input.title,
        description: input.description,
        distanceKm: input.distanceKm.toFixed(2),
        paceCategory: input.paceCategory,
        targetPace: input.targetPace,
        runDate: input.runDate,
        runTime: input.runTime,
        locationName: input.locationName,
        locationAddress: input.locationAddress,
        terrain: input.terrain || 'Road',
        maxParticipants: input.maxParticipants || 30,
        postRunSocial: input.postRunSocial || null,
        gearNotes: input.gearNotes || null,
        elevationMeters: input.elevationMeters || 25,
      })
      .returning();

    // Auto-RSVP the creator as going
    await db
      .insert(runRsvps)
      .values({
        runId: result[0].id,
        userUid: input.creatorUid,
        status: 'going',
        paceNote: 'Run Host',
      })
      .onConflictDoNothing();

    return result[0];
  } catch (error) {
    console.error('Failed to create run in Cloud SQL:', error);
    throw new Error('Failed to create run', { cause: error });
  }
}

export async function toggleRunRsvp(
  runId: number,
  userUid: string,
  status: 'going' | 'maybe' = 'going',
  paceNote?: string
) {
  try {
    const existing = await db
      .select()
      .from(runRsvps)
      .where(and(eq(runRsvps.runId, runId), eq(runRsvps.userUid, userUid)))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].status === status) {
        // Remove RSVP if toggled off
        await db.delete(runRsvps).where(eq(runRsvps.id, existing[0].id));
        return { action: 'removed', runId, userUid };
      } else {
        // Update status
        const updated = await db
          .update(runRsvps)
          .set({ status, paceNote: paceNote || existing[0].paceNote })
          .where(eq(runRsvps.id, existing[0].id))
          .returning();
        return { action: 'updated', rsvp: updated[0] };
      }
    }

    const inserted = await db
      .insert(runRsvps)
      .values({
        runId,
        userUid,
        status,
        paceNote: paceNote || null,
      })
      .returning();

    return { action: 'joined', rsvp: inserted[0] };
  } catch (error) {
    console.error('Failed to toggle RSVP in Cloud SQL:', error);
    throw new Error('Failed to update RSVP status', { cause: error });
  }
}

export async function addRunComment(
  runId: number,
  userUid: string,
  authorName: string,
  authorAvatar: string | undefined,
  message: string
) {
  try {
    const result = await db
      .insert(runComments)
      .values({
        runId,
        userUid,
        authorName,
        authorAvatar: authorAvatar || null,
        message,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to add comment to Cloud SQL:', error);
    throw new Error('Failed to post comment', { cause: error });
  }
}

export async function deleteRunById(runId: number, userUid: string) {
  try {
    const targetRun = await db.select().from(runs).where(eq(runs.id, runId)).limit(1);
    if (targetRun.length === 0) {
      return { notFound: true };
    }
    if (targetRun[0].creatorUid !== userUid) {
      return { forbidden: true };
    }

    await db.delete(runs).where(eq(runs.id, runId));
    return { success: true };
  } catch (error) {
    console.error('Failed to delete run from Cloud SQL:', error);
    throw new Error('Failed to delete run', { cause: error });
  }
}

export async function getClubSummary() {
  try {
    const allRuns = await db.select().from(runs);
    const allUsers = await db.select().from(users);
    const allRsvps = await db.select().from(runRsvps);

    const totalDistance = allRuns.reduce((acc, r) => acc + Number(r.distanceKm || 0), 0);
    const totalRsvps = allRsvps.filter((r) => r.status === 'going').length;

    return {
      totalUpcomingRuns: allRuns.length,
      totalClubDistanceKm: Math.round(totalDistance * 10) / 10,
      totalRunners: allUsers.length,
      totalRsvps,
    };
  } catch (error) {
    console.error('Failed to get club summary:', error);
    return {
      totalUpcomingRuns: 0,
      totalClubDistanceKm: 0,
      totalRunners: 0,
      totalRsvps: 0,
    };
  }
}
