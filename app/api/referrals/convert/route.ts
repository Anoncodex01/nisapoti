import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { emailService } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { referralCode, userId, conversionType = 'signup', conversionValue = 0 } = await request.json();

    if (!referralCode || !userId) {
      return NextResponse.json(
        { error: 'Referral code and user ID are required' },
        { status: 400 }
      );
    }

    // Find the referral record
    const referralRecord = await db.queryOne(
      `SELECT r.*
       FROM referrals r
       WHERE r.referral_code = ? AND r.status = 'clicked'
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [referralCode]
    );

    if (!referralRecord) {
      return NextResponse.json(
        { error: 'Referral record not found' },
        { status: 404 }
      );
    }

    // Update the referral record to mark as converted (retry once on ECONNRESET)
    const performUpdate = async () => {
      return db.execute(
        `UPDATE referrals 
         SET status = 'converted', 
             referred_user_id = ?, 
             conversion_type = ?, 
             conversion_value = ?, 
             converted_at = NOW()
         WHERE id = ?`,
        [userId, conversionType, conversionValue, referralRecord.id]
      );
    };

    let updateResult = await performUpdate();
    if (!updateResult.success && (updateResult.error || '').includes('ECONNRESET')) {
      console.warn('ECONNRESET during referral convert update. Retrying once...');
      await new Promise(r => setTimeout(r, 300));
      updateResult = await performUpdate();
    }

    if (!updateResult.success) {
      console.error('Failed to update referral record:', updateResult.error);
      return NextResponse.json(
        { error: 'Failed to update referral record' },
        { status: 500 }
      );
    }

    // Get referrer and referred user details for email notifications
    const referrerDetails = await db.queryOne(
      `SELECT u.email as referrer_email, p.display_name as referrer_name, p.username as referrer_username
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [referralRecord.referrer_user_id]
    );

    const referredUserDetails = await db.queryOne(
      `SELECT p.display_name as referred_name, p.username as referred_username
       FROM profiles p
       WHERE p.user_id = ?`,
      [userId]
    );

    // Send referral conversion notification email to referrer
    if (referrerDetails) {
      try {
        await emailService.sendReferralConversionEmail(
          referrerDetails.referrer_email,
          referrerDetails.referrer_name || referrerDetails.referrer_username,
          referredUserDetails?.referred_name || referredUserDetails?.referred_username || 'New User'
        );
      } catch (error) {
        console.log('Failed to send referral conversion email:', error);
        // Don't fail the request if email fails
      }
    }

    // Check and unlock rewards for referrer based on total conversions
    try {
      const totals = await db.query(
        `SELECT COUNT(*) AS cnt FROM referrals WHERE referrer_user_id = ? AND status = 'converted'`,
        [referralRecord.referrer_user_id]
      );
      const totalCount = totals[0]?.cnt || 0;

      const rewardTiers = [
        { invites: 1, title: 'Early access to new features', type: 'digital' },
        { invites: 3, title: 'Creator Spotlight feature', type: 'status' },
        { invites: 5, title: "Ambassador Badge + Priority Support", type: 'status' },
        { invites: 10, title: 'Premium Analytics + Newsletter Feature', type: 'service' },
        { invites: 50, title: 'Free Nisapoti T-shirt + Sticker', type: 'physical' },
        { invites: 100, title: 'Creator Starter Kit', type: 'physical' },
        { invites: 250, title: '🎤 Pro Creator Pack', type: 'physical' },
        { invites: 500, title: 'Big Creator Reward', type: 'physical' }
      ];

      for (const tier of rewardTiers) {
        if (totalCount >= tier.invites) {
          const existing = await db.query(
            `SELECT id FROM referral_reward_tiers WHERE user_id = ? AND invites_required = ?`,
            [referralRecord.referrer_user_id, tier.invites]
          );
          if (existing.length === 0) {
            // Insert reward record
            const inserted = await db.execute(
              `INSERT INTO referral_reward_tiers 
               (user_id, tier_level, invites_required, reward_title, reward_type, status, unlocked_at) 
               VALUES (?, ?, ?, ?, ?, 'unlocked', NOW())`,
              [referralRecord.referrer_user_id, tier.invites, tier.invites, tier.title, tier.type]
            );
            if (!inserted.success) {
              console.warn('Failed to insert reward tier:', inserted.error);
            } else if (referrerDetails?.referrer_email) {
              // Notify creator about the unlocked reward (non-blocking)
              emailService
                .sendRewardUnlockedEmail(
                  referrerDetails.referrer_email,
                  referrerDetails.referrer_name || referrerDetails.referrer_username || 'Creator',
                  tier.title,
                  tier.invites
                )
                .catch(err => console.log('Failed to send reward unlocked email:', err));
            }
          }
        }
      }
    } catch (err) {
      console.log('Reward unlock processing error:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Referral conversion recorded successfully',
      data: {
        referralId: referralRecord.id,
        referrerUserId: referralRecord.referrer_user_id,
        conversionType,
        conversionValue
      }
    });

  } catch (error) {
    console.error('Error recording referral conversion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}