import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { User, CreateUserRequest } from '@/lib/models';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, username, referralCode }: CreateUserRequest & { name: string; username: string; referralCode?: string } = await request.json();

    // Validate required fields
    if (!email || !password || !name || !username) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.queryOne(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Check if username is already taken
    const existingProfile = await db.queryOne(
      'SELECT id FROM profiles WHERE username = ?',
      [username]
    );

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate user ID
    const userId = uuidv4();

    // Create user in database
    await db.execute(
      'INSERT INTO users (id, email, password, email_verified, status) VALUES (?, ?, ?, ?, ?)',
      [userId, email, hashedPassword, 0, 'active']
    );

    // Create profile in database
    await db.execute(
      'INSERT INTO profiles (id, user_id, username, display_name, creator_url, status) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), userId, username, name, username, 'active']
    );

    // Handle referral conversion if referral code is provided
    // This is the ONLY place where referral conversion should happen
    if (referralCode) {
      try {
        const convertResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/referrals/convert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            referralCode,
            userId,
            conversionType: 'profile_complete',
            conversionValue: 0
          })
        });
        
        if (convertResponse.ok) {
          console.log('Referral conversion tracked successfully after profile completion');
        }
      } catch (error) {
        console.error('Error tracking referral conversion:', error);
        // Don't fail registration if referral tracking fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: userId,
        email,
        username,
        name
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
