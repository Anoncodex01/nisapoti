import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { Verification } from '@/lib/models';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, code, type = 'email' } = await request.json();

    // Validate inputs
    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    if (!['email', 'reset'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid verification type' },
        { status: 400 }
      );
    }

    // Test database connection first
    const dbConnected = await db.testConnection();
    
    if (dbConnected) {
      // Check if code exists and is valid in database
      const verification = await db.queryOne(
        'SELECT * FROM verifications WHERE email = ? AND token = ? ORDER BY created_at DESC LIMIT 1',
        [email, code]
      );
      
      if (!verification) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 400 }
        );
      }

      // Check if code has expired
      const now = new Date();
      const expiresAt = new Date(verification.expires_at);
      
      if (now > expiresAt) {
        // Delete expired code
        await db.execute('DELETE FROM verifications WHERE id = ?', [verification.id]);
        return NextResponse.json(
          { error: 'Verification code has expired' },
          { status: 400 }
        );
      }

      // Code is valid, remove it from database
      await db.execute('DELETE FROM verifications WHERE id = ?', [verification.id]);
    } else {
      // Development mode - accept any 6-digit code
      console.log('🔄 Database not available, accepting verification code for development');
      if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        return NextResponse.json(
          { error: 'Invalid verification code format' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });

  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

