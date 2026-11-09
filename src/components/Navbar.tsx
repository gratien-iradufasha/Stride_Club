// src/components/Navbar.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Plus, Compass, LogIn, LogOut, User as UserIcon, ChevronDown, Check } from 'lucide-react';

interface NavbarProps {
  onOpenPostModal: () => void;
  onOpenProfileModal: () => void;
  activeTab: 'all' | 'my-runs' | 'routes';
  setActiveTab: (tab: 'all' | 'my-runs' | 'routes') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenPostModal,
  onOpenProfileModal,
  activeTab,
  setActiveTab,
}) => {
  const { user, signInWithGoogle, signOut, setDemoUser } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('all')}
              className="flex items-center gap-3 text-left focus:outline-none group"
              aria-label="Stride Club Home"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black tracking-tighter text-xl shadow-lg shadow-emerald-950/50 group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-lg font-black tracking-wider uppercase text-white">
                  STRIDE<span className="text-emerald-400">CLUB</span>
                </span>
                <span className="block text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                  Community Group Runs
                </span>
              </div>
            </button>

            {/* Navigation tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'all'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Upcoming Runs
              </button>
              <button
                onClick={() => setActiveTab('my-runs')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'my-runs'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                My Joined Runs
              </button>
              <button
                onClick={() => setActiveTab('routes')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'routes'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Route Library
              </button>
            </nav>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {/* Post a Run Button */}
            <button
              onClick={onOpenPostModal}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl font-bold text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              aria-label="Post an upcoming run"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Post a Run</span>
              <span className="sm:hidden">Post</span>
            </button>

            {/* User Profile / Auth */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors focus:outline-none"
                aria-label="User account menu"
                aria-expanded={showUserDropdown}
              >
                <img
                  src={user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                  alt={user?.displayName || 'User'}
                  className="w-7 h-7 rounded-lg object-cover border border-emerald-500/50"
                />
                <span className="text-xs font-semibold text-slate-200 max-w-[100px] truncate hidden md:inline">
                  {user?.displayName || 'Sign In'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-3 border-b border-slate-800/80 mb-1">
                      <div className="text-xs font-bold text-slate-100 truncate">
                        {user?.displayName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {user?.email}
                      </div>
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {user?.paceGroup || 'Intermediate'}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenProfileModal();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      Runner Profile & Pace
                    </button>

                    {/* Switch runner persona for demo/testing */}
                    <div className="my-1.5 pt-1.5 border-t border-slate-800">
                      <span className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                        Switch Member Account
                      </span>
                      <button
                        onClick={() => {
                          setDemoUser('alex');
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-300"
                      >
                        <span>Alex Morgan (5:20/km)</span>
                        {user?.uid === 'demo-alex-runner' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                      <button
                        onClick={() => {
                          setDemoUser('sarah');
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-300"
                      >
                        <span>Coach Sarah (4:30/km)</span>
                        {user?.uid === 'coach-sarah-101' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                      <button
                        onClick={() => {
                          setDemoUser('marcus');
                          setShowUserDropdown(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-300"
                      >
                        <span>Marcus Vance (5:15/km)</span>
                        {user?.uid === 'marcus-pace-202' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    </div>

                    <div className="my-1 pt-1 border-t border-slate-800">
                      {user?.isDemo ? (
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            signInWithGoogle();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors text-left"
                        >
                          <LogIn className="w-4 h-4" />
                          Sign in with Google
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            signOut();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
