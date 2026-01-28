import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { User, Profile, LoginRequest } from '../../../../lib/models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Type assertion to help TypeScript understand JWT_SECRET is defined
const jwtSecret = JWT_SECRET as string;

export async function POST(request: NextRequest) {
  try {
    const { email, password }: LoginRequest = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Proceed with real database authentication
    const user = await db.queryOne(
      'SELECT * FROM users WHERE email = ? AND status = ?',
      [email, 'active']
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get user profile
    const profile = await db.queryOne(
      'SELECT * FROM profiles WHERE user_id = ? AND status = ?',
      [user.id, 'active']
    );

    // Check if profile is complete
    const isProfileComplete = profile && 
      profile.display_name && 
      profile.bio && 
      profile.category && 
      profile.avatar_url;

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

    // Set cookie
    const cookieStore = cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        email_verified: user.email_verified,
        profile_complete: isProfileComplete,
        profile: profile ? {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          creator_url: profile.creator_url,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          category: profile.category,
          website: profile.website
        } : null
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
