import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const jwtSecret = JWT_SECRET as string;

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Verify user credentials
    const loginResult = await db.verifyPassword(email, password);

    if (!loginResult.success) {
      return NextResponse.json(
        { error: loginResult.error || 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = loginResult.data;

    // Email verification is already checked in verifyPassword method

    // Get user profile
    const profileResult = await db.getProfileByUserId(user.id);
    const profile = profileResult.success ? profileResult.data : null;

    // Create JWT token (align with /api/auth/login-direct)
    const token = jwt.sign(
      {
        userId: user.id,
        username: profile?.username || user.email,
        display_name: profile?.display_name || user.email,
        avatar_url: profile?.avatar_url,
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Set authentication cookie so /api/auth/me can read it
    const cookieStore = cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // Create session-like response
    const profile_complete = !!profile;
    const session = {
      access_token: `token_${user.id}_${Date.now()}`,
      refresh_token: `refresh_${user.id}_${Date.now()}`,
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_verified ? new Date().toISOString() : null,
        profile_complete,
        created_at: user.created_at,
        updated_at: user.updated_at,
        user_metadata: {
          display_name: profile?.display_name || null,
          username: profile?.username || null,
          bio: profile?.bio || null,
          category: profile?.category || null,
          website: profile?.website || null,
          avatar_url: profile?.avatar_url || null
        },
        profile: profile
          ? {
              id: profile.id,
              username: profile.username,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              bio: profile.bio,
              category: profile.category,
              website: profile.website
            }
          : null
      }
    };

    // Also set cookie in response headers as backup
    const response = NextResponse.json({
      success: true,
      user: session.user,
      session: session,
      message: 'Login successful'
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
