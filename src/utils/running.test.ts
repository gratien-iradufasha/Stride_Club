// src/utils/running.test.ts
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  paceToSeconds,
  calculateEstimatedDuration,
  formatTimeAmPm,
  getDistanceCategory,
  filterRuns,
  filterRoutes,
  getAttendingRunnersSummary,
  buildRunInviteUrl,
  RunItem,
} from './running';

test('paceToSeconds parses pace strings into total seconds', () => {
  assert.equal(paceToSeconds('5:00 /km'), 300);
  assert.equal(paceToSeconds('5:30'), 330);
  assert.equal(paceToSeconds('4:15 /km'), 255);
  assert.equal(paceToSeconds(''), 330); // fallback default
});

test('calculateEstimatedDuration accurately computes run times', () => {
  // 10 km at 5:00/km (300s/km) = 3000s = 50 mins
  assert.equal(calculateEstimatedDuration(10, '5:00 /km'), '50 min');
  // 5 km at 6:00/km (360s/km) = 1800s = 30 mins
  assert.equal(calculateEstimatedDuration(5, '6:00 /km'), '30 min');
  // 21.1 km at 5:30/km (330s/km) = 6963s = 1h 56m
  assert.equal(calculateEstimatedDuration(21.1, '5:30 /km'), '1h 56m');
  // 0 km returns 0 min
  assert.equal(calculateEstimatedDuration(0, '5:00 /km'), '0 min');
});

test('formatTimeAmPm converts 24h string to AM/PM format', () => {
  assert.equal(formatTimeAmPm('07:30'), '7:30 AM');
  assert.equal(formatTimeAmPm('18:45'), '6:45 PM');
  assert.equal(formatTimeAmPm('12:00'), '12:00 PM');
  assert.equal(formatTimeAmPm('00:15'), '12:15 AM');
});

test('getDistanceCategory categorizes distances into short, medium, and long', () => {
  assert.equal(getDistanceCategory(5), 'Short (<7k)');
  assert.equal(getDistanceCategory(6.5), 'Short (<7k)');
  assert.equal(getDistanceCategory(8.5), 'Medium (7-14k)');
  assert.equal(getDistanceCategory(14), 'Medium (7-14k)');
  assert.equal(getDistanceCategory(16), 'Long (15k+)');
  assert.equal(getDistanceCategory(21.1), 'Long (15k+)');
});

test('filterRuns filters by search query, terrain, and distance', () => {
  const sampleRuns: RunItem[] = [
    {
      id: 1,
      creatorUid: 'user-1',
      title: 'Sunrise Regents Park Loop',
      description: 'Morning flat road loop',
      distanceKm: 8.5,
      paceCategory: 'Steady',
      targetPace: '5:30 /km',
      runDate: '2026-11-14',
      runTime: '07:30',
      locationName: 'Regents Park Hub',
      locationAddress: 'London',
      terrain: 'Road',
      rsvps: [{ userUid: 'user-2', status: 'going' }],
    },
    {
      id: 2,
      creatorUid: 'user-2',
      title: 'Hampstead Heath Hill Climbs',
      description: 'Muddy trails and ridge climbs',
      distanceKm: 16.0,
      paceCategory: 'Tempo',
      targetPace: '5:00 /km',
      runDate: '2026-11-15',
      runTime: '08:00',
      locationName: 'Parliament Hill',
      locationAddress: 'London',
      terrain: 'Trail',
      rsvps: [{ userUid: 'user-1', status: 'going' }],
    },
    {
      id: 3,
      creatorUid: 'user-3',
      title: 'Speed Work Track Session',
      description: '400m intervals on track',
      distanceKm: 5.0,
      paceCategory: 'Intervals',
      targetPace: '4:15 /km',
      runDate: '2026-11-17',
      runTime: '18:30',
      locationName: 'Paddington Track',
      locationAddress: 'London',
      terrain: 'Track',
      rsvps: [],
    },
  ];

  // Search filter
  const searchResults = filterRuns(sampleRuns, { searchQuery: 'Regents' });
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0].id, 1);

  // Terrain filter
  const trailResults = filterRuns(sampleRuns, { terrain: 'Trail' });
  assert.equal(trailResults.length, 1);
  assert.equal(trailResults[0].id, 2);

  // Distance range: short (<7k)
  const shortRuns = filterRuns(sampleRuns, { distanceRange: 'short' });
  assert.equal(shortRuns.length, 1);
  assert.equal(shortRuns[0].id, 3);

  // Distance range: long (>14k)
  const longRuns = filterRuns(sampleRuns, { distanceRange: 'long' });
  assert.equal(longRuns.length, 1);
  assert.equal(longRuns[0].id, 2);

  // My runs filter for user-1 (creator of #1, attending #2)
  const myRuns = filterRuns(sampleRuns, { dateFilter: 'my-runs', userUid: 'user-1' });
  assert.equal(myRuns.length, 2);
});

test('filterRoutes filters route library by search query and difficulty', () => {
  const sampleRoutes = [
    {
      id: 1,
      creatorUid: 'user-1',
      title: 'Richmond Park Perimeter Tamsin Trail',
      distanceKm: 11.5,
      difficulty: 'Moderate',
      startLocation: 'Richmond Gate Cafe',
      description: 'Gravel trail loop',
      terrain: 'Trail',
    },
    {
      id: 2,
      creatorUid: 'user-2',
      title: 'Thames Bridges Circuit',
      distanceKm: 8.2,
      difficulty: 'Easy',
      startLocation: 'Westminster Bridge',
      description: 'Paved river run',
      terrain: 'Road',
    },
    {
      id: 3,
      creatorUid: 'user-3',
      title: 'Box Hill Peak Summit',
      distanceKm: 15.0,
      difficulty: 'Challenging',
      startLocation: 'Box Hill Station',
      description: 'Steep hill repeats',
      terrain: 'Trail',
    },
  ];

  // Search by keyword
  const byName = filterRoutes(sampleRoutes, 'Richmond');
  assert.equal(byName.length, 1);
  assert.equal(byName[0].id, 1);

  // Search by start location
  const byLoc = filterRoutes(sampleRoutes, 'Westminster');
  assert.equal(byLoc.length, 1);
  assert.equal(byLoc[0].id, 2);

  // Filter by difficulty
  const easyRoutes = filterRoutes(sampleRoutes, undefined, 'Easy');
  assert.equal(easyRoutes.length, 1);
  assert.equal(easyRoutes[0].id, 2);

  const modRoutes = filterRoutes(sampleRoutes, undefined, 'Moderate');
  assert.equal(modRoutes.length, 1);
  assert.equal(modRoutes[0].id, 1);

  const allDiffRoutes = filterRoutes(sampleRoutes, undefined, 'all');
  assert.equal(allDiffRoutes.length, 3);
});

test('getAttendingRunnersSummary formats runner names appropriately', () => {
  assert.equal(getAttendingRunnersSummary([]), 'No runners yet');
  assert.equal(
    getAttendingRunnersSummary([{ userName: 'Coach Sarah', status: 'going' }]),
    'Coach Sarah'
  );
  assert.equal(
    getAttendingRunnersSummary([
      { userName: 'Coach Sarah', status: 'going' },
      { userName: 'Alex Morgan', status: 'going' },
    ]),
    'Coach Sarah, Alex Morgan'
  );
  assert.equal(
    getAttendingRunnersSummary([
      { userName: 'Coach Sarah', status: 'going' },
      { userName: 'Alex Morgan', status: 'going' },
      { userName: 'Marcus Vance', status: 'going' },
      { userName: 'Elena Rostova', status: 'going' },
    ]),
    'Coach Sarah, Alex Morgan +2 more'
  );
});

test('buildRunInviteUrl produces clean shareable link with query param', () => {
  assert.equal(buildRunInviteUrl('http://localhost:3000', 42), 'http://localhost:3000/?run=42');
  assert.equal(buildRunInviteUrl('https://strideclub.org/', 5), 'https://strideclub.org/?run=5');
});
