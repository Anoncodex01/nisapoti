import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const jwtSecret = JWT_SECRET as string;

export const dynamic = 'force-dynamic';

// Add CORS headers for mobile apps
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Verify user credentials
    const userResult = await db.verifyPassword(email, password);

    if (!userResult.success || !userResult.data) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = userResult.data;

    // Get user profile
    const profileResult = await db.getProfileByUserId(user.id);
    const profile = profileResult.success ? profileResult.data : null;

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: profile?.username || user.email,
        display_name: profile?.display_name || user.email,
        avatar_url: profile?.avatar_url
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    console.log('🔑 Direct login JWT token created for user:', user.id);

    // Set authentication cookie
    const cookieStore = cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      token: token, // Include token in response for mobile apps
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
        profile_complete: !!profile,
        profile: profile ? {
          id: profile.id,
          username: profile.username,
          display_url: profile.creator_url,
          display_name: profile.display_name,
          creator_url: profile.creator_url,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          category: profile.category,
          website: profile.website
        } : null
      }
    });

    // Also set cookie in response headers as backup
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    // Add CORS headers for mobile apps
    return addCorsHeaders(response);

  } catch (error) {
    console.error('Direct login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
