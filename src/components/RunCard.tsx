// src/components/RunCard.tsx
import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  TrendingUp,
  Users,
  MessageSquare,
  Coffee,
  Check,
  ArrowRight,
  Link,
  Share2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  RunItem,
  formatRunSchedule,
  calculateEstimatedDuration,
  buildRunInviteUrl,
} from '../utils/running.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface RunCardProps {
  run: RunItem;
  onSelect: (run: RunItem) => void;
  onToggleRsvp: (runId: number) => Promise<void>;
}

export const RunCard: React.FC<RunCardProps> = ({ run, onSelect, onToggleRsvp }) => {
  const { user } = useAuth();
  const [submittingRsvp, setSubmittingRsvp] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showRoster, setShowRoster] = useState(false);

  const attendingRunners = (run.rsvps || []).filter((r) => r.status === 'going');
  const isGoing = attendingRunners.some((r) => r.userUid === user?.uid);

  const handleRsvpClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (submittingRsvp) return;
    try {
      setSubmittingRsvp(true);
      await onToggleRsvp(run.id);
    } finally {
      setSubmittingRsvp(false);
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = buildRunInviteUrl(window.location.origin, run.id);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error('Failed to copy invite link', err);
    }
  };

  const getTerrainBadgeColor = (terrain: string) => {
    switch (terrain.toLowerCase()) {
      case 'trail':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'track':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'mixed':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  const durationEst = calculateEstimatedDuration(run.distanceKm, run.targetPace);
  const spotsLeft = run.maxParticipants ? run.maxParticipants - attendingRunners.length : null;

  return (
    <div
      onClick={() => onSelect(run)}
      className="group bg-slate-900 border border-slate-800 hover:border-slate-700 hover:shadow-xl rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer relative"
    >
      <div>
        {/* Top Badges & Distance */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider border ${getTerrainBadgeColor(
                run.terrain
              )}`}
            >
              {run.terrain}
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {run.paceCategory} • {run.targetPace}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xl font-black text-white">{run.distanceKm}</span>
            <span className="text-xs font-bold text-emerald-400 ml-0.5">km</span>
            <div className="text-[10px] text-slate-400">~{durationEst}</div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 mb-2">
          {run.title}
        </h3>

        {/* Schedule & Location */}
        <div className="space-y-1.5 text-xs text-slate-300 mb-3.5">
          <div className="flex items-center gap-2 text-slate-200">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{formatRunSchedule(run.runDate, run.runTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 line-clamp-1">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="truncate">{run.locationName}</span>
          </div>
          {run.elevationMeters && run.elevationMeters > 0 ? (
            <div className="flex items-center gap-2 text-slate-400">
              <TrendingUp className="w-4 h-4 text-teal-400 shrink-0" />
              <span>+{run.elevationMeters}m elevation gain</span>
            </div>
          ) : null}
        </div>

        {/* Description snippet */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {run.description}
        </p>

        {/* Post-run social note if any */}
        {run.postRunSocial && (
          <div className="mb-4 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-2 text-xs text-slate-300">
            <Coffee className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{run.postRunSocial}</span>
          </div>
        )}

        {/* Attending Runners List & Attendee Counter Section on Card */}
        <div className="mb-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
          {/* Attendee Counter Row */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <Users className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {attendingRunners.length} {attendingRunners.length === 1 ? 'Runner Attending' : 'Runners Attending'}
              </span>
            </div>
            {spotsLeft !== null && (
              <span className="text-[11px] text-slate-400">
                {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full capacity'}
              </span>
            )}
          </div>

          {/* List of Attending Runners */}
          {attendingRunners.length > 0 ? (
            <div className="space-y-1.5 pt-1 border-t border-slate-800/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Attending Runners:
                </span>
                {attendingRunners.length > 2 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRoster(!showRoster);
                    }}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-0.5"
                  >
                    <span>{showRoster ? 'Show less' : `View all (${attendingRunners.length})`}</span>
                    {showRoster ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {/* Runner Pills */}
              <div className="flex flex-wrap gap-1.5">
                {(showRoster ? attendingRunners : attendingRunners.slice(0, 3)).map((runner, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-200"
                    title={runner.paceNote ? `${runner.userName}: ${runner.paceNote}` : runner.userName || 'Runner'}
                  >
                    <img
                      src={
                        runner.userAvatar ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={runner.userName || 'Runner'}
                      className="w-4 h-4 rounded-full object-cover shrink-0"
                    />
                    <span className="font-medium truncate max-w-[110px]">
                      {runner.userName || 'Club Runner'}
                    </span>
                    {runner.paceNote && (
                      <span className="text-[9px] text-emerald-400 hidden sm:inline">
                        • {runner.paceNote}
                      </span>
                    )}
                  </div>
                ))}

                {!showRoster && attendingRunners.length > 3 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRoster(true);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 hover:text-slate-200 font-medium"
                  >
                    +{attendingRunners.length - 3} more
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-800/60">
              No runners joined yet. Be the first to RSVP!
            </div>
          )}
        </div>
      </div>

      {/* Footer: Organizer, Copy Invite Link & RSVP CTA */}
      <div className="pt-3.5 border-t border-slate-800/80 space-y-3">
        {/* Host & Discussion counter */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <img
              src={
                run.creatorAvatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
              }
              alt={run.creatorName || 'Host'}
              className="w-6 h-6 rounded-full object-cover border border-slate-700"
              title={`Organizer: ${run.creatorName || 'Runner'}`}
            />
            <span className="truncate max-w-[130px]">
              Host: <strong className="text-slate-300 font-semibold">{run.creatorName || 'Runner'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {run.commentsCount && run.commentsCount > 0 ? (
              <div className="flex items-center gap-1 text-slate-400">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{run.commentsCount}</span>
              </div>
            ) : null}

            {/* Copyable Invite Link Button */}
            <button
              onClick={handleCopyLink}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
              aria-label={`Copy invite link for ${run.title}`}
              title="Copy shareable invite link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Link className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Invite Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Row: RSVP Button and Details */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            onClick={handleRsvpClick}
            disabled={submittingRsvp}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
              isGoing
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
            }`}
            aria-label={isGoing ? 'Cancel RSVP' : `Join Run: ${run.title}`}
          >
            {isGoing ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>You're Attending (Joined)</span>
              </>
            ) : (
              <>
                <Users className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Join Run (RSVP)</span>
              </>
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(run);
            }}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors border border-slate-800 shrink-0"
            aria-label="View run details"
            title="View full run details & discussion"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
