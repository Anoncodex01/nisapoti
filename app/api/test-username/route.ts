import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username format
    if (username.length < 3 || username.length > 30) {
      return NextResponse.json({
        exists: true,
        error: 'Username must be between 3 and 30 characters'
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({
        exists: true,
        error: 'Username can only contain letters, numbers, and underscores'
      });
    }

    // Check if username exists in database
    const existingProfile = await db.queryOne(
      'SELECT id FROM profiles WHERE username = ? OR LOWER(username) = LOWER(?)',
      [username, username]
    );

    if (existingProfile) {
      return NextResponse.json({
        exists: true,
        error: 'This username is already taken. Please choose another one.'
      });
    }

    // Username is available
    return NextResponse.json({
      exists: false,
      message: 'Username is available'
    });

  } catch (error) {
    console.error('Error checking username:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
