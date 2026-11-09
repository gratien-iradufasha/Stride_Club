// src/components/RunDetailsModal.tsx
import React, { useState } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Route,
  TrendingUp,
  Users,
  Coffee,
  ShieldCheck,
  Send,
  Trash2,
  Check,
  Sparkles,
  MessageCircle,
  Link,
} from 'lucide-react';
import { RunItem, formatRunSchedule, calculateEstimatedDuration, buildRunInviteUrl } from '../utils/running.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface RunDetailsModalProps {
  run: RunItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleRsvp: (runId: number) => Promise<void>;
  onAddComment: (runId: number, message: string) => Promise<void>;
  onDeleteRun: (runId: number) => Promise<void>;
}

export const RunDetailsModal: React.FC<RunDetailsModalProps> = ({
  run,
  isOpen,
  onClose,
  onToggleRsvp,
  onAddComment,
  onDeleteRun,
}) => {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [togglingRsvp, setTogglingRsvp] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  if (!isOpen || !run) return null;

  const handleCopyInvite = async () => {
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
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2500);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const isGoing = (run.rsvps || []).some(
    (r) => r.userUid === user?.uid && r.status === 'going'
  );

  const isCreator = user?.uid === run.creatorUid;

  const handleRsvp = async () => {
    if (togglingRsvp) return;
    try {
      setTogglingRsvp(true);
      await onToggleRsvp(run.id);
    } finally {
      setTogglingRsvp(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;
    try {
      setSubmittingComment(true);
      await onAddComment(run.id, commentText.trim());
      setCommentText('');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to cancel and remove this run from the club schedule?')) {
      return;
    }
    try {
      setDeleting(true);
      await onDeleteRun(run.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const durationEstimate = calculateEstimatedDuration(run.distanceKm, run.targetPace);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 my-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors z-10"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="pr-10">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {run.terrain} Run
            </span>
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
              {run.paceCategory} • {run.targetPace}
            </span>
            {run.maxParticipants && (
              <span className="text-xs text-slate-400">
                Max {run.maxParticipants} runners
              </span>
            )}
            <button
              onClick={handleCopyInvite}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ml-auto ${
                copiedInvite
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
              }`}
              aria-label="Copy invite link"
            >
              {copiedInvite ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  <span>Invite Link Copied!</span>
                </>
              ) : (
                <>
                  <Link className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Invite Link</span>
                </>
              )}
            </button>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            {run.title}
          </h2>
        </div>

        {/* Key Metrics Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Distance</span>
            <span className="text-lg font-black text-emerald-400">{run.distanceKm} km</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Target Pace</span>
            <span className="text-lg font-black text-white">{run.targetPace}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Est. Duration</span>
            <span className="text-lg font-black text-teal-400">~{durationEstimate}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Elevation Gain</span>
            <span className="text-lg font-black text-white">+{run.elevationMeters || 20}m</span>
          </div>
        </div>

        {/* Meeting & Logistics */}
        <div className="mt-6 space-y-3">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <Calendar className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Date & Start Time</div>
              <div className="text-sm font-semibold text-slate-100">{formatRunSchedule(run.runDate, run.runTime)}</div>
              <div className="text-xs text-slate-400 mt-0.5">Please arrive 10 minutes early for dynamic warm-up drills</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <MapPin className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Meeting Point</div>
              <div className="text-sm font-semibold text-slate-100">{run.locationName}</div>
              <div className="text-xs text-slate-400">{run.locationAddress}</div>
            </div>
          </div>

          {run.postRunSocial && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <Coffee className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Post-Run Social Hangout</div>
                <div className="text-sm font-medium text-amber-200">{run.postRunSocial}</div>
              </div>
            </div>
          )}

          {run.gearNotes && (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Recommended Gear</div>
                <div className="text-sm text-slate-300">{run.gearNotes}</div>
              </div>
            </div>
          )}
        </div>

        {/* Route Description */}
        <div className="mt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Route Overview</h4>
          <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/30 p-4 rounded-xl border border-slate-800/60 whitespace-pre-line">
            {run.description}
          </p>
        </div>

        {/* Host Info */}
        <div className="mt-6 flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-3">
            <img
              src={run.creatorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={run.creatorName || 'Host'}
              className="w-11 h-11 rounded-xl object-cover border border-emerald-500/50"
            />
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">Run Organizer</span>
              <span className="text-sm font-bold text-white">{run.creatorName || 'Club Leader'}</span>
              <span className="text-xs text-slate-400 block">Host & Group Pacer</span>
            </div>
          </div>

          <button
            onClick={handleRsvp}
            disabled={togglingRsvp}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md ${
              isGoing
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
          >
            {isGoing ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>You are Attending</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>RSVP - Join Run</span>
              </>
            )}
          </button>
        </div>

        {/* Attendees List */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Runners Attending ({run.attendeeCount || 0})</span>
            </h4>
            <span className="text-xs text-slate-500">
              {run.maxParticipants ? `${run.maxParticipants - (run.attendeeCount || 0)} spots left` : 'Unlimited'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {(run.rsvps || []).length > 0 ? (
              run.rsvps?.map((rsvp, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800"
                >
                  <img
                    src={rsvp.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={rsvp.userName || 'Runner'}
                    className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                  />
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-200 truncate">{rsvp.userName || 'Runner'}</div>
                    <div className="text-[10px] text-emerald-400 truncate">{rsvp.paceNote || 'Attending'}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-4 text-xs text-slate-400 bg-slate-950/30 rounded-xl border border-slate-800/40">
                No runners signed up yet. Be the first to join!
              </div>
            )}
          </div>
        </div>

        {/* Member Discussion / Comments Feed */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
            <MessageCircle className="w-4 h-4 text-teal-400" />
            <span>Member Q&A & Discussion ({run.comments?.length || 0})</span>
          </h4>

          {/* Comments list */}
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
            {(run.comments || []).length > 0 ? (
              run.comments?.map((comment) => (
                <div
                  key={comment.id}
                  className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-start gap-3"
                >
                  <img
                    src={comment.authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                    alt={comment.authorName}
                    className="w-7 h-7 rounded-lg object-cover shrink-0 mt-0.5 border border-slate-700"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{comment.authorName}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{comment.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic py-2">
                Have questions about bag drops, pace groups, or route terrain? Ask the host below!
              </p>
            )}
          </div>

          {/* Post Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Ask a question or post a note for the group..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={submittingComment || !commentText.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* Creator Controls */}
        {isCreator && (
          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">You are the organizer of this run.</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition-colors font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Cancel / Delete Run</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
