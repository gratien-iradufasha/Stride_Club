// server/app.ts
import express, { Request, Response } from 'express';
import { requireAuth, optionalAuth, AuthRequest } from '../src/middleware/auth.ts';
import { getOrCreateUser, getUserProfile } from '../src/db/users.ts';
import {
  getAllRuns,
  getRunDetails,
  createNewRun,
  toggleRunRsvp,
  addRunComment,
  deleteRunById,
  getClubSummary,
} from '../src/db/runs.ts';
import {
  getAllRoutes,
  createNewRoute,
  deleteRouteById,
} from '../src/db/routes.ts';

const api = express();
api.use(express.json());

// List all saved favorite routes in library
api.get('/api/routes', optionalAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const routeList = await getAllRoutes();
    res.json(routeList);
  } catch (error: any) {
    console.error('API Error in GET /api/routes:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve routes' });
  }
});

// Save a new favorite route to library
api.post('/api/routes', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    await getOrCreateUser({
      uid: user.uid,
      email: user.email,
      displayName: user.name,
      avatarUrl: user.picture,
    });

    const { title, distanceKm, difficulty, startLocation, description, terrain, elevationMeters } = req.body;

    if (!title || !distanceKm || !startLocation) {
      return res.status(400).json({
        error: 'Please provide route title, distance (km), and start location',
      });
    }

    const parsedDistance = parseFloat(distanceKm);
    if (isNaN(parsedDistance) || parsedDistance <= 0) {
      return res.status(400).json({ error: 'Distance must be a positive number' });
    }

    const route = await createNewRoute({
      creatorUid: user.uid,
      title: title.trim(),
      distanceKm: parsedDistance,
      difficulty: difficulty || 'Moderate',
      startLocation: startLocation.trim(),
      description: description ? description.trim() : undefined,
      terrain: terrain || 'Road',
      elevationMeters: elevationMeters ? parseInt(elevationMeters, 10) : 20,
    });

    res.status(201).json(route);
  } catch (error: any) {
    console.error('API Error in POST /api/routes:', error);
    res.status(500).json({ error: error.message || 'Failed to save route' });
  }
});

// Delete a route from library (creator only)
api.delete('/api/routes/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const routeId = parseInt(req.params.id, 10);
    if (isNaN(routeId)) {
      return res.status(400).json({ error: 'Invalid route ID' });
    }

    const result = await deleteRouteById(routeId, user.uid);
    if (result.notFound) {
      return res.status(404).json({ error: 'Route not found' });
    }
    if (result.forbidden) {
      return res.status(403).json({ error: 'Only the creator can delete this route' });
    }

    res.json({ message: 'Route deleted successfully' });
  } catch (error: any) {
    console.error(`API Error in DELETE /api/routes/${req.params.id}:`, error);
    res.status(500).json({ error: error.message || 'Failed to delete route' });
  }
});

// Club stats
api.get('/api/club/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getClubSummary();
    res.json(stats);
  } catch (error: any) {
    console.error('API Error in /api/club/stats:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch club stats' });
  }
});

// List all upcoming runs
api.get('/api/runs', optionalAuth, async (_req: AuthRequest, res: Response) => {
  try {
    const runsList = await getAllRuns();
    res.json(runsList);
  } catch (error: any) {
    console.error('API Error in GET /api/runs:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve runs' });
  }
});

// Get run details
api.get('/api/runs/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const runId = parseInt(req.params.id, 10);
    if (isNaN(runId)) {
      return res.status(400).json({ error: 'Invalid run ID' });
    }
    const run = await getRunDetails(runId);
    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }
    res.json(run);
  } catch (error: any) {
    console.error(`API Error in GET /api/runs/${req.params.id}:`, error);
    res.status(500).json({ error: error.message || 'Failed to retrieve run details' });
  }
});

// Post a new run
api.post('/api/runs', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    // Ensure creator user exists in database
    await getOrCreateUser({
      uid: user.uid,
      email: user.email,
      displayName: user.name,
      avatarUrl: user.picture,
    });

    const {
      title,
      description,
      distanceKm,
      paceCategory,
      targetPace,
      runDate,
      runTime,
      locationName,
      locationAddress,
      terrain,
      maxParticipants,
      postRunSocial,
      gearNotes,
      elevationMeters,
    } = req.body;

    if (!title || !description || !distanceKm || !paceCategory || !runDate || !runTime || !locationName) {
      return res.status(400).json({
        error: 'Please fill in all required fields: title, description, distance, pace, date, time, and location',
      });
    }

    const parsedDistance = parseFloat(distanceKm);
    if (isNaN(parsedDistance) || parsedDistance <= 0) {
      return res.status(400).json({ error: 'Distance must be a positive number' });
    }

    const created = await createNewRun({
      creatorUid: user.uid,
      title: title.trim(),
      description: description.trim(),
      distanceKm: parsedDistance,
      paceCategory: paceCategory || 'Steady',
      targetPace: targetPace ? targetPace.trim() : '5:30 /km',
      runDate: runDate.trim(),
      runTime: runTime.trim(),
      locationName: locationName.trim(),
      locationAddress: (locationAddress || locationName).trim(),
      terrain: terrain || 'Road',
      maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : 30,
      postRunSocial: postRunSocial ? postRunSocial.trim() : undefined,
      gearNotes: gearNotes ? gearNotes.trim() : undefined,
      elevationMeters: elevationMeters ? parseInt(elevationMeters, 10) : 25,
    });

    res.status(201).json(created);
  } catch (error: any) {
    console.error('API Error in POST /api/runs:', error);
    res.status(500).json({ error: error.message || 'Failed to post run' });
  }
});

// Toggle RSVP for a run
api.post('/api/runs/:id/rsvp', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const runId = parseInt(req.params.id, 10);
    if (isNaN(runId)) {
      return res.status(400).json({ error: 'Invalid run ID' });
    }

    // Ensure user exists in database
    await getOrCreateUser({
      uid: user.uid,
      email: user.email,
      displayName: user.name,
      avatarUrl: user.picture,
    });

    const status = req.body.status || 'going';
    const paceNote = req.body.paceNote;

    const result = await toggleRunRsvp(runId, user.uid, status, paceNote);
    res.json(result);
  } catch (error: any) {
    console.error(`API Error in POST /api/runs/${req.params.id}/rsvp:`, error);
    res.status(500).json({ error: error.message || 'Failed to update RSVP' });
  }
});

// Add comment to a run
api.post('/api/runs/:id/comments', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const runId = parseInt(req.params.id, 10);
    if (isNaN(runId)) {
      return res.status(400).json({ error: 'Invalid run ID' });
    }

    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    await getOrCreateUser({
      uid: user.uid,
      email: user.email,
      displayName: user.name,
      avatarUrl: user.picture,
    });

    const comment = await addRunComment(
      runId,
      user.uid,
      user.name || 'Club Runner',
      user.picture,
      message.trim()
    );

    res.status(201).json(comment);
  } catch (error: any) {
    console.error(`API Error in POST /api/runs/${req.params.id}/comments:`, error);
    res.status(500).json({ error: error.message || 'Failed to add comment' });
  }
});

// Delete a run (creator only)
api.delete('/api/runs/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const runId = parseInt(req.params.id, 10);
    if (isNaN(runId)) {
      return res.status(400).json({ error: 'Invalid run ID' });
    }

    const outcome = await deleteRunById(runId, user.uid);
    if (outcome.notFound) {
      return res.status(404).json({ error: 'Run not found' });
    }
    if (outcome.forbidden) {
      return res.status(403).json({ error: 'Only the run organizer can cancel this run' });
    }

    res.json({ message: 'Run successfully cancelled' });
  } catch (error: any) {
    console.error(`API Error in DELETE /api/runs/${req.params.id}:`, error);
    res.status(500).json({ error: error.message || 'Failed to delete run' });
  }
});

// Sync user profile
api.post('/api/users/sync', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { displayName, paceGroup, bio, avatarUrl } = req.body;

    const profile = await getOrCreateUser({
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.name,
      avatarUrl: avatarUrl || user.picture,
      paceGroup,
      bio,
    });

    res.json(profile);
  } catch (error: any) {
    console.error('API Error in POST /api/users/sync:', error);
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

// Get current user profile
api.get('/api/users/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const profile = await getUserProfile(user.uid);
    res.json(profile || { uid: user.uid, email: user.email, displayName: user.name });
  } catch (error: any) {
    console.error('API Error in GET /api/users/me:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve profile' });
  }
});

export default api;
