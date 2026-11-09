// src/components/HeroStats.tsx
import React from 'react';
import { Flame, Route, Users, CalendarCheck, Sparkles, MapPin } from 'lucide-react';
import { RunItem, formatRunSchedule } from '../utils/running.ts';

interface HeroStatsProps {
  stats: {
    totalUpcomingRuns: number;
    totalClubDistanceKm: number;
    totalRunners: number;
    totalRsvps: number;
  };
  nextRun?: RunItem;
  onSelectRun: (run: RunItem) => void;
  onOpenPostModal: () => void;
}

export const HeroStats: React.FC<HeroStatsProps> = ({
  stats,
  nextRun,
  onSelectRun,
  onOpenPostModal,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800 py-10 sm:py-14 text-slate-100">
      {/* Background accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Main Hero Copy */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>London Running Collective • All Paces Welcome</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase leading-none">
              Run Together. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Pace Every Mile.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Find upcoming weekday interval sessions, scenic Saturday park loops, and Sunday long runs.
              Join pace groups, share post-run coffee plans, and organize your own routes with real-time Cloud SQL sync.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenPostModal}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
              >
                Organize an Upcoming Run
              </button>
              <a
                href="#upcoming-runs"
                className="px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-800/60 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-all"
              >
                Explore Runs Below
              </a>
            </div>
          </div>

          {/* Next Run Card / Callout */}
          <div className="lg:col-span-5">
            {nextRun ? (
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 shadow-2xl relative group hover:border-emerald-500/50 transition-all">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Next Up on the Calendar
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {nextRun.distanceKm} km
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                    {nextRun.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{formatRunSchedule(nextRun.runDate, nextRun.runTime)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 line-clamp-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{nextRun.locationName}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-200">
                      {nextRun.paceCategory} ({nextRun.targetPace})
                    </span>
                    <span className="text-xs text-slate-400">
                      {nextRun.attendeeCount || 0} attending
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectRun(nextRun)}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
                  >
                    View Run Details →
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 text-center">
                <CalendarCheck className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">No upcoming runs scheduled</p>
                <p className="text-xs text-slate-500 mt-1">Be the first to post a weekend group run!</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Metrics Bar */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">{stats.totalUpcomingRuns}</div>
              <div className="text-xs font-medium text-slate-400">Upcoming Runs</div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">{stats.totalClubDistanceKm} km</div>
              <div className="text-xs font-medium text-slate-400">Total Planned Route</div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">{stats.totalRunners}</div>
              <div className="text-xs font-medium text-slate-400">Club Runners</div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">{stats.totalRsvps}</div>
              <div className="text-xs font-medium text-slate-400">Run RSVPs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
