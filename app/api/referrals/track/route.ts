import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { emailService } from '@/lib/email';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { referralCode, ipAddress, userAgent, referrerUrl } = await request.json();

    if (!referralCode) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
    }

    // Get referrer details by username (since we're using usernames as referral codes)
    const referrerDetails = await db.query(
      `SELECT u.id as user_id, u.email, p.username, p.display_name 
       FROM users u 
       LEFT JOIN profiles p ON u.id = p.user_id 
       WHERE p.username = ? AND u.status = 'active'`,
      [referralCode]
    );

    if (referrerDetails.length === 0) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    const referrer = referrerDetails[0];

    // Create referral record in database
    const referralId = randomUUID();
    const insertResult = await db.execute(
      `INSERT INTO referrals (id, referrer_user_id, referral_code, ip_address, user_agent, referrer_url, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'clicked', NOW())`,
      [referralId, referrer.user_id, referralCode, ipAddress, userAgent, referrerUrl]
    );

    if (!insertResult.success) {
      console.error('Failed to insert referral record:', insertResult.error);
      // Still return success to not break the user experience
    }

    // Trigger referral click notification email to referrer (non-blocking)
    emailService
      .sendReferralClickEmail(
        referrer.email,
        referrer.display_name || referrer.username
      )
      .catch((error) => {
        console.log('Failed to send referral click email:', error);
      });

    return NextResponse.json({
      success: true,
      data: {
        referralId: referralId,
        referrer: {
          username: referrer.username,
          display_name: referrer.display_name,
          email: referrer.email
        },
        message: 'Referral tracked successfully'
      }
    });

  } catch (error) {
    console.error('Error tracking referral:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
