// src/components/PostRunModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Route, Flag, AlertCircle, Sparkles, Check } from 'lucide-react';
import { calculateEstimatedDuration, SavedRoute } from '../utils/running.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface PostRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunCreated: () => void;
  availableRoutes?: SavedRoute[];
  initialRoute?: SavedRoute | null;
}

export const PostRunModal: React.FC<PostRunModalProps> = ({
  isOpen,
  onClose,
  onRunCreated,
  availableRoutes = [],
  initialRoute = null,
}) => {
  const { user, token } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRouteId, setSelectedRouteId] = useState<number | ''>('');

  // Form State
  const [title, setTitle] = useState('');
  const [distanceKm, setDistanceKm] = useState('10');
  const [paceCategory, setPaceCategory] = useState('Steady');
  const [targetPace, setTargetPace] = useState('5:30 /km');
  const [runDate, setRunDate] = useState(() => {
    const d = new Date();
    const daysUntilSaturday = (6 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSaturday);
    return d.toISOString().split('T')[0];
  });
  const [runTime, setRunTime] = useState('08:00');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [terrain, setTerrain] = useState('Road');
  const [maxParticipants, setMaxParticipants] = useState('25');
  const [elevationMeters, setElevationMeters] = useState('30');
  const [postRunSocial, setPostRunSocial] = useState('Post-run coffee and pastries at the local cafe');
  const [gearNotes, setGearNotes] = useState('');
  const [description, setDescription] = useState('');

  // Pre-fill from route helper
  const applyRoute = (route: SavedRoute) => {
    setSelectedRouteId(route.id);
    setTitle(`${route.title} Run`);
    setDistanceKm(route.distanceKm.toString());
    setLocationName(route.startLocation);
    setLocationAddress(route.startLocation);
    setTerrain(route.terrain || 'Road');
    setElevationMeters((route.elevationMeters || 20).toString());
    setDescription(route.description || `Group run following the ${route.title} route.`);
  };

  useEffect(() => {
    if (initialRoute) {
      applyRoute(initialRoute);
    }
  }, [initialRoute, isOpen]);

  const handleRouteChange = (routeIdStr: string) => {
    if (!routeIdStr) {
      setSelectedRouteId('');
      return;
    }
    const rId = parseInt(routeIdStr, 10);
    const found = availableRoutes.find((r) => r.id === rId);
    if (found) {
      applyRoute(found);
    }
  };

  const handleClearRoute = () => {
    setSelectedRouteId('');
  };

  if (!isOpen) return null;

  const selectedRouteObj = availableRoutes.find((r) => r.id === selectedRouteId);

  const durationEstimate = calculateEstimatedDuration(
    parseFloat(distanceKm) || 0,
    targetPace
  );

  const handleDistancePreset = (km: number) => {
    setDistanceKm(km.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a title for the run.');
      return;
    }
    if (!distanceKm || parseFloat(distanceKm) <= 0) {
      setError('Please specify a valid distance in kilometers.');
      return;
    }
    if (!locationName.trim()) {
      setError('Please enter a meeting location name.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a description or route overview for members.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          distanceKm: parseFloat(distanceKm),
          paceCategory,
          targetPace,
          runDate,
          runTime,
          locationName,
          locationAddress: locationAddress || locationName,
          terrain,
          maxParticipants: parseInt(maxParticipants, 10) || 30,
          elevationMeters: parseInt(elevationMeters, 10) || 20,
          postRunSocial,
          gearNotes,
          description,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to post run to Cloud SQL database');
      }

      onRunCreated();
      onClose();
    } catch (err: any) {
      console.error('Error posting run:', err);
      setError(err.message || 'An error occurred while creating the run');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
              <Flag className="w-5 h-5 text-emerald-400" />
              Schedule an Upcoming Run
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Publish a group run to the Stride Club calendar with instant Cloud SQL persistence.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Route Library Selector */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Route className="w-4 h-4" />
              <span>Select from Route Library (Optional)</span>
            </label>
            {selectedRouteObj && (
              <button
                type="button"
                onClick={handleClearRoute}
                className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Clear Selection</span>
              </button>
            )}
          </div>

          <select
            value={selectedRouteId}
            onChange={(e) => handleRouteChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="">-- Choose a saved favorite route to pre-fill --</option>
            {availableRoutes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title} ({r.distanceKm} km • {r.difficulty} • {r.startLocation})
              </option>
            ))}
          </select>

          {selectedRouteObj && (
            <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                Pre-filled from: <strong>{selectedRouteObj.title}</strong> ({selectedRouteObj.distanceKm} km, {selectedRouteObj.difficulty})
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Run Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Run Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunday Richmond Park Deer Loop & Flat Whites"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Distance and Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Distance (km) *
              </label>
              <span className="text-xs text-emerald-400 font-semibold">
                Est. Duration: ~{durationEstimate}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.1"
                min="1"
                max="100"
                required
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="w-32 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="flex flex-wrap gap-1.5">
                {[5, 8, 10, 15, 21.1].map((km) => (
                  <button
                    type="button"
                    key={km}
                    onClick={() => handleDistancePreset(km)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      parseFloat(distanceKm) === km
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {km} km
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pace Category and Target Pace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Pace Category
              </label>
              <select
                value={paceCategory}
                onChange={(e) => {
                  const cat = e.target.value;
                  setPaceCategory(cat);
                  if (cat === 'Social / Easy') setTargetPace('6:15 /km');
                  else if (cat === 'Steady') setTargetPace('5:30 /km');
                  else if (cat === 'Tempo') setTargetPace('5:00 /km');
                  else if (cat === 'Intervals') setTargetPace('4:30 /km');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Social / Easy">Social / Easy (6:15+ /km)</option>
                <option value="Steady">Steady (5:15 - 5:45 /km)</option>
                <option value="Tempo">Tempo (4:45 - 5:15 /km)</option>
                <option value="Intervals">Speed & Intervals (&lt;4:45 /km)</option>
                <option value="All Paces">All Paces Welcome</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Target Pace (e.g. 5:30 /km)
              </label>
              <input
                type="text"
                value={targetPace}
                onChange={(e) => setTargetPace(e.target.value)}
                placeholder="e.g. 5:30 /km"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Date, Time, and Terrain */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Date *
              </label>
              <input
                type="date"
                required
                value={runDate}
                onChange={(e) => setRunDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={runTime}
                onChange={(e) => setRunTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Terrain
              </label>
              <select
                value={terrain}
                onChange={(e) => setTerrain(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Road">Road</option>
                <option value="Trail">Trail</option>
                <option value="Track">Track</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
          </div>

          {/* Location Name & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Meeting Landmark / Spot *
              </label>
              <input
                type="text"
                required
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Richmond Gate Cafe"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Street Address / Postcode
              </label>
              <input
                type="text"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="e.g. Richmond Park, Richmond TW10 5HS"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Description & Route details */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Route Details & Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the route highlights, turnarounds, bag drop options, and pacing advice..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Post-Run Social & Gear notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Post-Run Hangout / Social
              </label>
              <input
                type="text"
                value={postRunSocial}
                onChange={(e) => setPostRunSocial(e.target.value)}
                placeholder="e.g. Flat whites and sourdough at Ole & Steen"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Gear / Kit Recommendations
              </label>
              <input
                type="text"
                value={gearNotes}
                onChange={(e) => setGearNotes(e.target.value)}
                placeholder="e.g. Trail lugs, water bottle, headlamp"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Elevation and Capacity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Elevation Gain (+m)
              </label>
              <input
                type="number"
                value={elevationMeters}
                onChange={(e) => setElevationMeters(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Max Runners
              </label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Publishing to Cloud SQL...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publish Upcoming Run</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
