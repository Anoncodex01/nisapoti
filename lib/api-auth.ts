import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

const getTokenFromRequest = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }
  return request.cookies.get('auth-token')?.value || null;
};

export const requireAuth = (request: NextRequest): AuthResult => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return { ok: false, status: 500, error: 'JWT_SECRET is not configured' };
  }

  const token = getTokenFromRequest(request);
  if (!token) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as { userId?: string };
    if (!decoded?.userId) {
      return { ok: false, status: 401, error: 'Invalid token' };
    }
    return { ok: true, userId: decoded.userId };
  } catch (error) {
    return { ok: false, status: 401, error: 'Invalid token' };
  }
};
