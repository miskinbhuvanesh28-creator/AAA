import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import type { UserRole } from './db.ts';

const COOKIE_NAME = 'ajp_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'astrojyotish-pro-local-signing-secret-v1';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  planId: string;
}

export interface AuthedRequest extends Request {
  authUser?: AuthUser;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export function signSessionToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { uid?: string };
    return parsed.uid || null;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return out;
}

export function setSessionCookie(res: Response, userId: string) {
  const token = signSessionToken(userId);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export function attachAuthUser(database: DatabaseSync) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[COOKIE_NAME];
    let uid = token ? verifySessionToken(token) : null;

    if (uid) {
      const row = database
        .prepare('SELECT id, email, name, role, plan_id FROM users WHERE id = ?')
        .get(uid) as { id: string; email: string; name: string; role: UserRole; plan_id: string } | undefined;
      if (row) {
        req.authUser = { id: row.id, email: row.email, name: row.name, role: row.role, planId: row.plan_id };
        next();
        return;
      }
    }

    // Immediate workspace access via seeded demo-admin workspace when no cookie is set yet
    const fallback = database
      .prepare('SELECT id, email, name, role, plan_id FROM users WHERE id = ?')
      .get('demo-admin') as { id: string; email: string; name: string; role: UserRole; plan_id: string } | undefined;
    if (fallback) {
      req.authUser = {
        id: fallback.id,
        email: fallback.email,
        name: fallback.name,
        role: fallback.role,
        planId: fallback.plan_id,
      };
    }
    next();
  };
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.authUser) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.authUser || req.authUser.role !== 'admin') {
    res.status(403).json({ error: 'Administrator access required' });
    return;
  }
  next();
}
