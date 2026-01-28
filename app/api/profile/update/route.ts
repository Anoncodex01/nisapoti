import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { user_id, username, display_name, bio, category, website, avatar_url } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if profile exists
    const existingProfile = await db.getProfileByUserId(user_id);

    if (existingProfile.success && existingProfile.data) {
      // Update existing profile
      const updateResult = await db.updateProfile(user_id, {
        display_name,
        username,
        bio,
        category,
        website,
        avatar_url
      });

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
    } else {
      // Create new profile
      const createResult = await db.execute(
        `INSERT INTO profiles (id, user_id, username, display_name, bio, category, website, avatar_url, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [Math.random().toString(36).substr(2, 9) + Date.now().toString(36), user_id, username, display_name, bio, category, website, avatar_url]
      );

      if (!createResult.success) {
        return NextResponse.json(
          { error: createResult.error || 'Failed to create profile' },
          { status: 500 }
        );
      }

      // Get the created profile
      const profile = await db.getProfileByUserId(user_id);
      
      return NextResponse.json({
        success: true,
        data: profile.data,
        message: 'Profile created successfully'
      });
    }

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