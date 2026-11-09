// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';

export interface RunnerUser {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  paceGroup?: string;
  bio?: string;
  isDemo?: boolean;
}

interface AuthContextType {
  user: RunnerUser | null;
  loading: boolean;
  token: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setDemoUser: (demoId: 'alex' | 'sarah' | 'marcus') => void;
  updateProfile: (data: { displayName?: string; paceGroup?: string; bio?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_RUNNERS: Record<string, RunnerUser> = {
  alex: {
    uid: 'demo-alex-runner',
    email: 'alex.m@strideclub.org',
    displayName: 'Alex Morgan',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    paceGroup: 'Steady (5:20/km)',
    bio: 'Half-marathon enthusiast prepping for spring 2027.',
    isDemo: true,
  },
  sarah: {
    uid: 'coach-sarah-101',
    email: 'sarah.run@strideclub.org',
    displayName: 'Coach Sarah Jenkins',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    paceGroup: 'Sub-4:30 /km (Speed & Intervals)',
    bio: 'Marathon pacer & certified UKA endurance coach.',
    isDemo: true,
  },
  marcus: {
    uid: 'marcus-pace-202',
    email: 'marcus.tempo@strideclub.org',
    displayName: 'Marcus Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    paceGroup: 'Steady (5:15 /km)',
    bio: 'Trail explorer and early morning coffee chaser.',
    isDemo: true,
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RunnerUser | null>(DEMO_RUNNERS.alex);
  const [token, setToken] = useState<string | null>(
    `demo-runner:${DEMO_RUNNERS.alex.uid}:${DEMO_RUNNERS.alex.email}:${encodeURIComponent(DEMO_RUNNERS.alex.displayName)}`
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        const runner: RunnerUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Club Runner',
          avatarUrl: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          isDemo: false,
        };
        setUser(runner);
        setToken(idToken);

        // Sync with Cloud SQL users table
        try {
          await fetch('/api/users/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              displayName: runner.displayName,
              avatarUrl: runner.avatarUrl,
            }),
          });
        } catch (e) {
          console.error('Failed to sync profile to Cloud SQL', e);
        }
      } else {
        // Fallback to initial demo runner if not signed in with Google
        // This ensures the application is 100% interactive out of the box
        if (!user || !user.isDemo) {
          const defaultRunner = DEMO_RUNNERS.alex;
          setUser(defaultRunner);
          setToken(
            `demo-runner:${defaultRunner.uid}:${defaultRunner.email}:${encodeURIComponent(defaultRunner.displayName)}`
          );
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const res = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await res.user.getIdToken();
      const runner: RunnerUser = {
        uid: res.user.uid,
        email: res.user.email || '',
        displayName: res.user.displayName || 'Club Runner',
        avatarUrl: res.user.photoURL || '',
        isDemo: false,
      };
      setUser(runner);
      setToken(idToken);

      await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          displayName: runner.displayName,
          avatarUrl: runner.avatarUrl,
        }),
      });
    } catch (error) {
      console.error('Google Sign In error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Reset to Alex demo session
      const defaultRunner = DEMO_RUNNERS.alex;
      setUser(defaultRunner);
      setToken(
        `demo-runner:${defaultRunner.uid}:${defaultRunner.email}:${encodeURIComponent(defaultRunner.displayName)}`
      );
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  const setDemoUser = (key: 'alex' | 'sarah' | 'marcus') => {
    const selected = DEMO_RUNNERS[key] || DEMO_RUNNERS.alex;
    setUser(selected);
    setToken(
      `demo-runner:${selected.uid}:${selected.email}:${encodeURIComponent(selected.displayName)}`
    );
  };

  const updateProfile = async (data: { displayName?: string; paceGroup?: string; bio?: string }) => {
    if (!user || !token) return;
    const updated: RunnerUser = {
      ...user,
      displayName: data.displayName || user.displayName,
      paceGroup: data.paceGroup || user.paceGroup,
      bio: data.bio || user.bio,
    };
    setUser(updated);

    try {
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: updated.displayName,
          paceGroup: updated.paceGroup,
          bio: updated.bio,
          avatarUrl: updated.avatarUrl,
        }),
      });
    } catch (e) {
      console.error('Failed to update profile in Cloud SQL', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        signInWithGoogle,
        signOut,
        setDemoUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
