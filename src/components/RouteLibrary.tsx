// src/components/RouteLibrary.tsx
import React, { useState } from 'react';
import {
  Route as RouteIcon,
  Search,
  Plus,
  MapPin,
  TrendingUp,
  CalendarPlus,
  Trash2,
  X,
  Compass,
} from 'lucide-react';
import { SavedRoute, filterRoutes, getDifficultyBadgeColor } from '../utils/running.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface RouteLibraryProps {
  routes: SavedRoute[];
  onOpenSaveModal: () => void;
  onSelectRouteForSchedule: (route: SavedRoute) => void;
  onDeleteRoute: (routeId: number) => Promise<void>;
}

export const RouteLibrary: React.FC<RouteLibraryProps> = ({
  routes,
  onOpenSaveModal,
  onSelectRouteForSchedule,
  onDeleteRoute,
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filtered = filterRoutes(routes, searchQuery, difficultyFilter);

  const handleDelete = async (e: React.MouseEvent, routeId: number) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this route from the library?')) {
      return;
    }
    try {
      setDeletingId(routeId);
      await onDeleteRoute(routeId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Route Library Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-2.5">
              <RouteIcon className="w-7 h-7 text-emerald-400" />
              Club Route Library
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Curated running loops, river paths, and trail climbs saved by club members. Pick any route to schedule a group run.
          </p>
        </div>

        <button
          onClick={onOpenSaveModal}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Save New Route</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search routes by name, park, meeting point, or landmarks..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Difficulty Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['all', 'Easy', 'Moderate', 'Challenging', 'Epic'].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  difficultyFilter === diff
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {diff === 'all' ? 'All Difficulties' : diff}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
          <span>
            Showing <strong className="text-white font-bold">{filtered.length}</strong> {filtered.length === 1 ? 'route' : 'routes'} in club library
          </span>
          {(searchQuery || difficultyFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDifficultyFilter('all');
              }}
              className="text-rose-400 hover:text-rose-300 text-xs"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Routes Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((route) => {
            const isCreator = user?.uid === route.creatorUid;
            return (
              <div
                key={route.id}
                className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl"
              >
                <div>
                  {/* Badges row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${getDifficultyBadgeColor(
                          route.difficulty
                        )}`}
                      >
                        {route.difficulty}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {route.terrain}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-white">{route.distanceKm}</span>
                      <span className="text-xs font-bold text-emerald-400 ml-0.5">km</span>
                      {route.elevationMeters && route.elevationMeters > 0 && (
                        <div className="text-[10px] text-teal-400">+{route.elevationMeters}m</div>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 mb-2">
                    {route.title}
                  </h3>

                  {/* Start Location */}
                  <div className="flex items-center gap-2 text-xs text-slate-300 mb-3 line-clamp-1">
                    <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="truncate">{route.startLocation}</span>
                  </div>

                  {/* Description */}
                  {route.description && (
                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                      {route.description}
                    </p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <img
                        src={route.creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={route.creatorName || 'Member'}
                        className="w-6 h-6 rounded-full object-cover border border-slate-700"
                      />
                      <span className="truncate max-w-[120px]">{route.creatorName || 'Club Member'}</span>
                    </div>

                    {isCreator && (
                      <button
                        onClick={(e) => handleDelete(e, route.id)}
                        disabled={deletingId === route.id}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Delete route from library"
                        aria-label={`Delete ${route.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectRouteForSchedule(route)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    aria-label={`Schedule run from ${route.title}`}
                  >
                    <CalendarPlus className="w-4 h-4" />
                    <span>Schedule Run from this Route</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto text-slate-400">
            <Compass className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No routes match your search</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Try adjusting your difficulty filter or search keyword, or save a brand new route to the library!
            </p>
          </div>
          <button
            onClick={onOpenSaveModal}
            className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs hover:bg-emerald-400 transition-colors"
          >
            Save a New Route
          </button>
        </div>
      )}
    </div>
  );
};
