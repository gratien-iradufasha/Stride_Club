// src/utils/running.ts

export interface RunItem {
  id: number;
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
  terrain: string;
  maxParticipants?: number | null;
  postRunSocial?: string | null;
  gearNotes?: string | null;
  elevationMeters?: number | null;
  creatorName?: string | null;
  creatorAvatar?: string | null;
  attendeeCount?: number;
  rsvps?: Array<{
    userUid: string;
    status: string;
    userName?: string | null;
    userAvatar?: string | null;
    paceNote?: string | null;
  }>;
  commentsCount?: number;
  comments?: Array<{
    id: number;
    runId: number;
    userUid: string;
    authorName: string;
    authorAvatar?: string | null;
    message: string;
    createdAt?: any;
  }>;
}

export interface SavedRoute {
  id: number;
  creatorUid: string;
  title: string;
  distanceKm: number;
  difficulty: 'Easy' | 'Moderate' | 'Challenging' | 'Epic' | string;
  startLocation: string;
  description?: string | null;
  terrain?: string;
  elevationMeters?: number | null;
  creatorName?: string | null;
  creatorAvatar?: string | null;
  createdAt?: any;
}

export interface RunFilters {
  searchQuery?: string;
  terrain?: string; // 'all' | 'Road' | 'Trail' | 'Track' | 'Mixed'
  paceCategory?: string; // 'all' | 'Social / Easy' | 'Steady' | 'Tempo' | 'Intervals'
  distanceRange?: string; // 'all' | 'short' (<7km) | 'medium' (7-14km) | 'long' (>14km)
  dateFilter?: string; // 'all' | 'weekend' | 'my-runs'
  userUid?: string;
}

/**
 * Parses pace string like '5:30' or '5:30 /km' into total seconds per km.
 */
export function paceToSeconds(paceStr: string): number {
  if (!paceStr) return 330; // default 5:30
  const match = paceStr.match(/(\d+):(\d{2})/);
  if (!match) return 330;
  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  return minutes * 60 + seconds;
}

/**
 * Calculates human-readable duration estimate for a given distance and target pace.
 * e.g. 10 km at 5:00 /km = 50 min
 * e.g. 21.1 km at 5:30 /km = 1h 56m
 */
export function calculateEstimatedDuration(distanceKm: number, paceStr: string): string {
  if (!distanceKm || distanceKm <= 0) return '0 min';
  const paceSec = paceToSeconds(paceStr);
  const totalSec = Math.round(distanceKm * paceSec);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.round((totalSec % 3600) / 60);

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins} min`;
}

/**
 * Categorizes a run distance into standard running buckets.
 */
export function getDistanceCategory(distanceKm: number): 'Short (<7k)' | 'Medium (7-14k)' | 'Long (15k+)' {
  if (distanceKm < 7) return 'Short (<7k)';
  if (distanceKm <= 14) return 'Medium (7-14k)';
  return 'Long (15k+)';
}

/**
 * Formats a 24-hr time like "07:30" or "18:30" into "7:30 AM" or "6:30 PM".
 */
export function formatTimeAmPm(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const min = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${min} ${ampm}`;
}

/**
 * Formats ISO date "YYYY-MM-DD" and time into a friendly date display.
 */
export function formatRunSchedule(dateStr: string, timeStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[dateObj.getDay()];
  const monthName = months[dateObj.getMonth()];
  const timeFormatted = formatTimeAmPm(timeStr);
  
  return `${dayName}, ${monthName} ${day} • ${timeFormatted}`;
}

/**
 * Filters runs list based on user criteria.
 */
export function filterRuns(runsList: RunItem[], filters: RunFilters): RunItem[] {
  return runsList.filter((run) => {
    // Search Query (title, location, description, creator)
    if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
      const q = filters.searchQuery.toLowerCase();
      const matchTitle = run.title.toLowerCase().includes(q);
      const matchLoc = run.locationName.toLowerCase().includes(q) || run.locationAddress.toLowerCase().includes(q);
      const matchDesc = run.description.toLowerCase().includes(q);
      const matchCreator = (run.creatorName || '').toLowerCase().includes(q);
      if (!matchTitle && !matchLoc && !matchDesc && !matchCreator) {
        return false;
      }
    }

    // Terrain Filter
    if (filters.terrain && filters.terrain !== 'all') {
      if (run.terrain.toLowerCase() !== filters.terrain.toLowerCase()) {
        return false;
      }
    }

    // Pace Category
    if (filters.paceCategory && filters.paceCategory !== 'all') {
      if (!run.paceCategory.toLowerCase().includes(filters.paceCategory.toLowerCase())) {
        return false;
      }
    }

    // Distance Range
    if (filters.distanceRange && filters.distanceRange !== 'all') {
      if (filters.distanceRange === 'short' && run.distanceKm >= 7) return false;
      if (filters.distanceRange === 'medium' && (run.distanceKm < 7 || run.distanceKm > 14)) return false;
      if (filters.distanceRange === 'long' && run.distanceKm <= 14) return false;
    }

    // Date / My Runs Filter
    if (filters.dateFilter === 'my-runs') {
      if (!filters.userUid) return false;
      const isCreator = run.creatorUid === filters.userUid;
      const isAttending = (run.rsvps || []).some(
        (r) => r.userUid === filters.userUid && r.status === 'going'
      );
      if (!isCreator && !isAttending) return false;
    }

    return true;
  });
}

/**
 * Filters the route library list by keyword search and difficulty.
 */
export function filterRoutes(
  routesList: SavedRoute[],
  query?: string,
  difficulty?: string
): SavedRoute[] {
  return routesList.filter((route) => {
    if (query && query.trim().length > 0) {
      const q = query.toLowerCase();
      const matchTitle = route.title.toLowerCase().includes(q);
      const matchLoc = route.startLocation.toLowerCase().includes(q);
      const matchDesc = (route.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchLoc && !matchDesc) return false;
    }

    if (difficulty && difficulty !== 'all') {
      if (route.difficulty.toLowerCase() !== difficulty.toLowerCase()) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Returns color classes for route difficulty levels.
 */
export function getDifficultyBadgeColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case 'easy':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'moderate':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'challenging':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'epic':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

/**
 * Returns formatted summary string of attending runners for cards.
 */
export function getAttendingRunnersSummary(
  rsvps?: Array<{ userName?: string | null; status?: string }>
): string {
  if (!rsvps || rsvps.length === 0) return 'No runners yet';
  const going = rsvps
    .filter((r) => r.status === 'going')
    .map((r) => r.userName || 'Runner');

  if (going.length === 0) return 'No runners yet';
  if (going.length <= 2) return going.join(', ');
  return `${going.slice(0, 2).join(', ')} +${going.length - 2} more`;
}

/**
 * Builds invite URL for a specific run.
 */
export function buildRunInviteUrl(baseUrl: string, runId: number): string {
  const cleanBase = baseUrl.replace(/\/$/, '');
  return `${cleanBase}/?run=${runId}`;
}
