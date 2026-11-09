// src/App.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { HeroStats } from './components/HeroStats.tsx';
import { RunFiltersBar } from './components/RunFiltersBar.tsx';
import { RunCard } from './components/RunCard.tsx';
import { PostRunModal } from './components/PostRunModal.tsx';
import { RunDetailsModal } from './components/RunDetailsModal.tsx';
import { UserProfileModal } from './components/UserProfileModal.tsx';
import { RouteLibrary } from './components/RouteLibrary.tsx';
import { SaveRouteModal } from './components/SaveRouteModal.tsx';
import { RunItem, RunFilters, filterRuns, SavedRoute } from './utils/running.ts';
import { Plus, Compass, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

function RunningClubApp() {
  const { user, token } = useAuth();
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clubStats, setClubStats] = useState({
    totalUpcomingRuns: 0,
    totalClubDistanceKm: 0,
    totalRunners: 0,
    totalRsvps: 0,
  });

  // Navigation tab: 'all' | 'my-runs' | 'routes'
  const [activeTab, setActiveTab] = useState<'all' | 'my-runs' | 'routes'>('all');

  // Filters state
  const [filters, setFilters] = useState<RunFilters>({
    searchQuery: '',
    terrain: 'all',
    paceCategory: 'all',
    distanceRange: 'all',
  });

  // Modals state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isSaveRouteModalOpen, setIsSaveRouteModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<RunItem | null>(null);
  const [selectedRouteForSchedule, setSelectedRouteForSchedule] = useState<SavedRoute | null>(null);

  // Fetch runs, routes & stats
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [runsRes, routesRes, statsRes] = await Promise.all([
        fetch('/api/runs', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch('/api/routes', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        fetch('/api/club/stats'),
      ]);

      if (!runsRes.ok) throw new Error('Failed to load runs from Cloud SQL database');
      const runsData = await runsRes.json();
      setRuns(runsData);

      if (routesRes.ok) {
        const routesData = await routesRes.json();
        setRoutes(routesData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setClubStats(statsData);
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Error communicating with database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Keep selectedRun updated when runs list changes
  useEffect(() => {
    if (selectedRun) {
      const refreshed = runs.find((r) => r.id === selectedRun.id);
      if (refreshed) {
        setSelectedRun(refreshed);
      }
    }
  }, [runs]);

  // Handle invite links (?run=ID)
  useEffect(() => {
    if (runs.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const runIdParam = params.get('run');
      if (runIdParam) {
        const targetId = parseInt(runIdParam, 10);
        const match = runs.find((r) => r.id === targetId);
        if (match) {
          setSelectedRun(match);
        }
      }
    }
  }, [runs]);

  // RSVP toggle action
  const handleToggleRsvp = async (runId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/runs/${runId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'going' }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error toggling RSVP:', err);
    }
  };

  // Add Comment action
  const handleAddComment = async (runId: number, message: string) => {
    if (!token) return;
    const res = await fetch(`/api/runs/${runId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });
    if (res.ok) {
      const detailsRes = await fetch(`/api/runs/${runId}`);
      if (detailsRes.ok) {
        const updatedRun = await detailsRes.json();
        setSelectedRun(updatedRun);
        setRuns((prev) => prev.map((r) => (r.id === runId ? updatedRun : r)));
      }
    }
  };

  // Delete run action
  const handleDeleteRun = async (runId: number) => {
    if (!token) return;
    const res = await fetch(`/api/runs/${runId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      setSelectedRun(null);
      await fetchData();
    }
  };

  // Delete route action
  const handleDeleteRoute = async (routeId: number) => {
    if (!token) return;
    const res = await fetch(`/api/routes/${routeId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      setRoutes((prev) => prev.filter((r) => r.id !== routeId));
    }
  };

  // Handle schedule run from route library
  const handleSelectRouteForSchedule = (route: SavedRoute) => {
    setSelectedRouteForSchedule(route);
    setIsPostModalOpen(true);
  };

  // Filtered runs
  const filteredRuns = useMemo(() => {
    return filterRuns(runs, {
      ...filters,
      dateFilter: activeTab === 'my-runs' ? 'my-runs' : undefined,
      userUid: user?.uid,
    });
  }, [runs, filters, activeTab, user?.uid]);

  const nextUpcomingRun = runs.length > 0 ? runs[0] : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Navbar */}
      <Navbar
        onOpenPostModal={() => {
          setSelectedRouteForSchedule(null);
          setIsPostModalOpen(true);
        }}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Hero Section with Live Stats (shown on runs tabs) */}
      {activeTab !== 'routes' && (
        <HeroStats
          stats={clubStats}
          nextRun={nextUpcomingRun}
          onSelectRun={(run) => setSelectedRun(run)}
          onOpenPostModal={() => {
            setSelectedRouteForSchedule(null);
            setIsPostModalOpen(true);
          }}
        />
      )}

      {/* Main Content Area */}
      <main id="upcoming-runs" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {activeTab === 'routes' ? (
          /* Route Library View */
          <RouteLibrary
            routes={routes}
            onOpenSaveModal={() => setIsSaveRouteModalOpen(true)}
            onSelectRouteForSchedule={handleSelectRouteForSchedule}
            onDeleteRoute={handleDeleteRoute}
          />
        ) : (
          /* Runs View */
          <>
            {/* Section Heading & Refresh */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                    {activeTab === 'all' ? 'Upcoming Club Runs' : 'My Joined Runs'}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {activeTab === 'all'
                    ? 'Join an organized pace group or organize your own run for the club.'
                    : 'Runs you are currently organizing or attending.'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchData}
                  className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-xl transition-colors"
                  title="Refresh runs"
                  aria-label="Refresh run schedule"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedRouteForSchedule(null);
                    setIsPostModalOpen(true);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Post Run</span>
                </button>
              </div>
            </div>

            {/* Filters Bar */}
            <RunFiltersBar
              filters={filters}
              onChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
              onReset={() =>
                setFilters({
                  searchQuery: '',
                  terrain: 'all',
                  paceCategory: 'all',
                  distanceRange: 'all',
                })
              }
              totalMatching={filteredRuns.length}
            />

            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Runs Grid / Loading / Empty State */}
            {loading && runs.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-slate-300">Connecting to Cloud SQL database...</p>
              </div>
            ) : filteredRuns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRuns.map((run) => (
                  <RunCard
                    key={run.id}
                    run={run}
                    onSelect={(selected) => setSelectedRun(selected)}
                    onToggleRsvp={handleToggleRsvp}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto text-slate-400">
                  <Compass className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">No runs match your criteria</h3>
                  <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                    {activeTab === 'my-runs'
                      ? "You haven't joined or organized any upcoming runs yet. Browse the schedule and RSVP to your first run!"
                      : 'Try clearing your search query or selecting a different terrain or distance range.'}
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  {activeTab === 'my-runs' ? (
                    <button
                      onClick={() => setActiveTab('all')}
                      className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs hover:bg-emerald-400 transition-colors"
                    >
                      Browse All Runs
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedRouteForSchedule(null);
                        setIsPostModalOpen(true);
                      }}
                      className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs hover:bg-emerald-400 transition-colors"
                    >
                      Post a New Run
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-8 text-center text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-200">STRIDE CLUB</span>
            <span>•</span>
            <span>Community Running App & Route Library</span>
          </div>
          <div>
            Powered by Cloud SQL (PostgreSQL) & Firebase Auth • Built for runners of all paces
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PostRunModal
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          setSelectedRouteForSchedule(null);
        }}
        onRunCreated={fetchData}
        availableRoutes={routes}
        initialRoute={selectedRouteForSchedule}
      />

      <SaveRouteModal
        isOpen={isSaveRouteModalOpen}
        onClose={() => setIsSaveRouteModalOpen(false)}
        onRouteSaved={(newRoute) => {
          setRoutes((prev) => [newRoute, ...prev]);
        }}
      />

      <RunDetailsModal
        run={selectedRun}
        isOpen={Boolean(selectedRun)}
        onClose={() => setSelectedRun(null)}
        onToggleRsvp={handleToggleRsvp}
        onAddComment={handleAddComment}
        onDeleteRun={handleDeleteRun}
      />

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RunningClubApp />
    </AuthProvider>
  );
}
