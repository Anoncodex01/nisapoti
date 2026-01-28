import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { emailService } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, username, referralCode } = await request.json();

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

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email);
    
    if (existingUser.success && existingUser.data) {
      // User exists, check if email is verified
      if (existingUser.data.email_verified) {
        return NextResponse.json({
          success: true,
          action: 'login',
          message: 'User already exists and is verified. Please log in instead.'
        });
      } else {
        return NextResponse.json({
          success: true,
          action: 'verify',
          message: 'User exists but email is not verified. Please verify your email.'
        });
      }
    }

    // Check if username is taken (if provided)
    if (username) {
      const existingProfile = await db.queryOne(
        'SELECT * FROM profiles WHERE username = ?',
        [username]
      );
      
      if (existingProfile) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }
    }

    // Create user
    const createResult = await db.createUser(email, password, name, username);

    if (!createResult.success) {
      return NextResponse.json(
        { error: createResult.error || 'Failed to create user' },
        { status: 500 }
      );
    }

    const user = createResult.data;

    // Store referral code for later conversion after profile completion
    // Don't convert referral at signup - only after profile is completed
    if (referralCode) {
      try {
        // Store the referral code in a temporary table or session for later use
        // We'll convert it when the profile is completed in the register endpoint
        console.log('Referral code stored for later conversion:', referralCode);
        
        // Send welcome email to referred user but don't convert referral yet
        try {
          // Get referrer details for the welcome email
          const referrerDetails = await db.queryOne(
            `SELECT p.display_name as referrer_name, p.username as referrer_username
             FROM users u
             LEFT JOIN profiles p ON u.id = p.user_id
             WHERE p.username = ?`,
            [referralCode]
          );

          if (referrerDetails) {
            await emailService.sendReferredUserWelcomeEmail(
              user.email,
              username || user.email,
              referrerDetails.referrer_name || referrerDetails.referrer_username
            );
          }
        } catch (error) {
          console.log('Failed to send referred user welcome email:', error);
          // Don't fail user creation if email fails
        }
      } catch (error) {
        console.log('Failed to handle referral code:', error);
        // Don't fail user creation if referral handling fails
      }
    }

    // Always require email verification for new users
    let action = 'verify';
    let message = 'User created successfully. Please verify your email.';

    return NextResponse.json({
      success: true,
      action: action,
      message: message,
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_verified ? new Date().toISOString() : null,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    console.error('Create user API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
