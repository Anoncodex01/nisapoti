import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const jwtSecret = JWT_SECRET as string;

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      userId = decoded.userId;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Disable user account
    const res = await db.execute(
      'UPDATE users SET status = "disabled", updated_at = NOW() WHERE id = ? LIMIT 1',
      [userId]
    );
    if (!res.success) {
      return NextResponse.json({ error: res.error || 'Failed to disable account' }, { status: 500 });
    }

    // Optionally hide profile from listings if profiles table has status
    try {
      await db.execute('UPDATE profiles SET status = "disabled", updated_at = NOW() WHERE user_id = ? LIMIT 1', [userId]);
    } catch {}

    // Clear auth cookie
    const response = NextResponse.json({ success: true, message: 'Account disabled. You have been logged out.' });
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
