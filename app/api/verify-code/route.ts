import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

// Type assertion to help TypeScript understand JWT_SECRET is defined
const jwtSecret = JWT_SECRET as string;

export async function POST(request: NextRequest) {
  try {
    const { email, code, type = 'signup', username } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Validate code format
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Code must be 6 digits' },
        { status: 400 }
      );
    }

    // Check if verification code exists and is valid
    const verification = await db.queryOne(
      `SELECT id, email, token, expires_at, created_at FROM verifications 
       WHERE email = ? AND token = ? AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [email, code]
    );

    if (!verification) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 400 }
      );
    }

    // Delete the used verification code
    await db.execute(
      'DELETE FROM verifications WHERE id = ?',
      [verification.id]
    );

    // If this is email verification (signup), mark user email as verified and authenticate user
    // Some clients send type='email' for email verification; treat it the same as 'signup'
    if (type === 'signup' || type === 'email') {
      const userResult = await db.getUserByEmail(email);
      
      if (userResult.success && userResult.data) {
        const user = userResult.data;
        
        // Mark email as verified
        await db.execute(
          'UPDATE users SET email_verified = 1 WHERE id = ?',
          [user.id]
        );

        // Get user profile if it exists
        const profileResult = await db.getProfileByUserId(user.id);
        const profile = profileResult.success ? profileResult.data : null;

        // Use username from request or fallback to profile/email
        const finalUsername = username || profile?.username || user.email;
        
        console.log('🔑 Creating JWT token for user:', user.id, 'username:', finalUsername);
        
        // Create JWT token
        const token = jwt.sign(
          {
            userId: user.id,
            username: finalUsername,
            display_name: profile?.display_name || user.email,
            avatar_url: profile?.avatar_url
          },
          jwtSecret,
          { expiresIn: '7d' }
        );
        
        console.log('🔑 JWT token created successfully, length:', token.length);

        // Set authentication cookie
        const cookieStore = cookies();
        cookieStore.set('auth-token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 // 7 days
        });
        
        console.log('✅ JWT token created and cookie set for user:', user.id);

        const response = NextResponse.json({
          success: true,
          message: 'Verification successful',
          user: {
            id: user.id,
            email: user.email,
            email_verified: 1,
            profile_complete: !!profile,
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

        // Set cookie in response headers as well
        response.cookies.set('auth-token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 // 7 days
        });

        return response;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verification successful'
    });

  } catch (error) {
    console.error('Verify code API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
