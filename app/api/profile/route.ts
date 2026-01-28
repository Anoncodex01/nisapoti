import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user profile
    const profileResult = await db.getProfileByUserId(userId);

    if (!profileResult.success) {
      return NextResponse.json(
        { error: profileResult.error || 'Failed to get profile' },
        { status: 500 }
      );
    }

    const profile = profileResult.data;

    if (!profile) {
      // Return 200 with success=false so clients can treat this as "no profile yet"
      return NextResponse.json({ success: false, data: null, message: 'Profile not found' });
    }

    return NextResponse.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, ...profileData } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Update profile
    const updateResult = await db.updateProfile(userId, profileData);

    if (!updateResult.success) {
      return NextResponse.json(
        { error: updateResult.error || 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updateResult.data,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
