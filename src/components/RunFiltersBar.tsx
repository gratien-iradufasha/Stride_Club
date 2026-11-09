// src/components/RunFiltersBar.tsx
import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { RunFilters } from '../utils/running.ts';

interface RunFiltersBarProps {
  filters: RunFilters;
  onChange: (updated: Partial<RunFilters>) => void;
  onReset: () => void;
  totalMatching: number;
}

export const RunFiltersBar: React.FC<RunFiltersBarProps> = ({
  filters,
  onChange,
  onReset,
  totalMatching,
}) => {
  const isFiltered = Boolean(
    (filters.searchQuery && filters.searchQuery.length > 0) ||
    (filters.terrain && filters.terrain !== 'all') ||
    (filters.paceCategory && filters.paceCategory !== 'all') ||
    (filters.distanceRange && filters.distanceRange !== 'all')
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
      {/* Search Input & Reset row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery || ''}
            onChange={(e) => onChange({ searchQuery: e.target.value })}
            placeholder="Search by run name, park, meeting spot, or organizer..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChange({ searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
          <span className="text-slate-400 font-medium">
            Showing <strong className="text-white font-bold">{totalMatching}</strong> {totalMatching === 1 ? 'run' : 'runs'}
          </span>
          {isFiltered && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 font-medium transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips & Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
        {/* Terrain Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Terrain
          </label>
          <div className="flex flex-wrap gap-1.5">
            {['all', 'Road', 'Trail', 'Track', 'Mixed'].map((t) => (
              <button
                key={t}
                onClick={() => onChange({ terrain: t })}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  (filters.terrain || 'all') === t
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {t === 'all' ? 'All Terrains' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Distance Range */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Distance
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'short', label: '<7 km' },
              { id: 'medium', label: '7-14 km' },
              { id: 'long', label: '15+ km' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => onChange({ distanceRange: d.id })}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  (filters.distanceRange || 'all') === d.id
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pace Category */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Pace Category
          </label>
          <select
            value={filters.paceCategory || 'all'}
            onChange={(e) => onChange({ paceCategory: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Pace Groups</option>
            <option value="Social">Social / Easy (6:15+ /km)</option>
            <option value="Steady">Steady (5:15 - 5:45 /km)</option>
            <option value="Tempo">Tempo (4:45 - 5:15 /km)</option>
            <option value="Intervals">Speed & Intervals</option>
          </select>
        </div>
      </div>
    </div>
  );
};
