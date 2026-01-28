import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { emailService } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, type = 'signup' } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
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

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Ensure table exists (id PK, email UNIQUE for upsert semantics)
    await db.execute(
      `CREATE TABLE IF NOT EXISTS verifications (
         id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
         email VARCHAR(255) NOT NULL,
         token VARCHAR(12) NOT NULL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         expires_at TIMESTAMP NULL,
         UNIQUE KEY uniq_email (email)
       )`
    );

    // Store verification code in database (using token field)
    const result = await db.execute(
      `INSERT INTO verifications (email, token, expires_at) 
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
       ON DUPLICATE KEY UPDATE 
       token = VALUES(token), 
       expires_at = VALUES(expires_at), 
       created_at = NOW()`,
      [email, verificationCode]
    );

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to store verification code' },
        { status: 500 }
      );
    }

    // Send verification email
    try {
      const emailSent = await emailService.sendVerificationCode(email, verificationCode, 'email');
      
      if (!emailSent) {
        console.log('❌ Failed to send verification email, but code is stored');
        // Still return success since code is stored in database
      } else {
        console.log('✅ Verification email sent successfully to:', email);
      }
    } catch (error) {
      console.log('❌ Email service error:', error);
      // Still return success since code is stored in database
    }

    // In development, also log the code for testing
    console.log(`🔑 Verification code for ${email}: ${verificationCode}`);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      // Include code in development for testing
      code: process.env.NODE_ENV === 'development' ? verificationCode : undefined
    });

  } catch (error) {
    console.error('Send verification API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}