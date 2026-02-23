import type { Request, Response, NextFunction } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import pool from '../db/pool.js';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  sessionId?: string;
}

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

export function generateToken(userId: string, sessionId: string): string {
  return jwt.sign({ userId, sessionId }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): { userId: string; sessionId: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string; sessionId: string };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);

    // Verify session still exists and isn't expired
    const { rows } = await pool.query(
      'SELECT id, user_id, mfa_verified FROM sessions WHERE id = $1 AND user_id = $2 AND expires_at > NOW()',
      [payload.sessionId, payload.userId],
    );

    if (rows.length === 0) {
      res.status(401).json({ error: 'Session expired or invalid' });
      return;
    }

    req.userId = payload.userId;
    req.sessionId = payload.sessionId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
