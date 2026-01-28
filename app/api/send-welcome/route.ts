import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, username } = await request.json();

    // Validate email
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Validate username
    if (!username || username.trim().length === 0) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Send welcome email
    const emailSent = await emailService.sendWelcomeEmail(email, username);

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send welcome email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully',
    });

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
