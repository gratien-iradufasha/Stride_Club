// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    name?: string;
    picture?: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  
  // Support seamless local testing / demo runner token
  if (token.startsWith('demo-runner:')) {
    const parts = token.split(':');
    const demoUid = parts[1] || 'demo-runner-001';
    const demoEmail = parts[2] || 'runner.alex@strideclub.org';
    const demoName = parts[3] ? decodeURIComponent(parts[3]) : 'Alex Morgan';
    req.user = {
      uid: demoUid,
      email: demoEmail,
      name: demoName,
      picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'Runner'),
      picture: decodedToken.picture || '',
    };
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split('Bearer ')[1];
  if (token.startsWith('demo-runner:')) {
    const parts = token.split(':');
    const demoUid = parts[1] || 'demo-runner-001';
    const demoEmail = parts[2] || 'runner.alex@strideclub.org';
    const demoName = parts[3] ? decodeURIComponent(parts[3]) : 'Alex Morgan';
    req.user = {
      uid: demoUid,
      email: demoEmail,
      name: demoName,
      picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };
    return next();
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'Runner'),
      picture: decodedToken.picture || '',
    };
  } catch {
    // Continue unauthenticated if token verification fails
  }
  next();
};
