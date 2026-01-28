import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Email, code, and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Verify the reset code
    const verification = await db.queryOne(
      `SELECT * FROM verifications 
       WHERE email = ? AND token = ? AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, code]
    );

    if (!verification) {
      return NextResponse.json(
        { error: 'Invalid or expired reset code' },
        { status: 400 }
      );
    }

    // Get user
    const userResult = await db.getUserByEmail(email);
    
    if (!userResult.success || !userResult.data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    const updateResult = await db.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userResult.data.id]
    );

    if (!updateResult.success) {
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Delete the used verification code
    await db.execute(
      'DELETE FROM verifications WHERE id = ?',
      [verification.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
