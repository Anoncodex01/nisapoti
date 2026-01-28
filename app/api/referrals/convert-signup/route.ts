import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const newUserId = decoded.userId;

    const { referralCode } = await request.json();

    if (!referralCode) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
    }

    // Find the referral record
    const referral = await db.query(
      `SELECT r.*, rc.user_id as referrer_id 
       FROM referrals r 
       JOIN referral_codes rc ON r.referral_code_id = rc.id 
       WHERE r.referral_code = ? AND r.status = 'pending'`,
      [referralCode]
    );

    if (referral.length === 0) {
      return NextResponse.json({ error: 'Referral not found or already converted' }, { status: 404 });
    }

    const referralData = referral[0];

    // Update referral status to converted
    await db.execute(
      `UPDATE referrals 
       SET status = 'converted', 
           referred_id = ?, 
           conversion_type = 'signup', 
           converted_at = NOW() 
       WHERE id = ?`,
      [newUserId, referralData.id]
    );

    // Create conversion record
    await db.execute(
      `INSERT INTO referral_conversions (referral_id, referred_user_id, conversion_type) 
       VALUES (?, ?, 'signup')`,
      [referralData.id, newUserId]
    );

    // Check if referrer should unlock any rewards
    await checkAndUnlockRewards(referralData.referrer_id);

    return NextResponse.json({
      success: true,
      data: {
        referralId: referralData.id,
        referrerId: referralData.referrer_id,
        conversionType: 'signup'
      }
    });

  } catch (error) {
    console.error('Error converting referral signup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function checkAndUnlockRewards(referrerId: string) {
  try {
    // Get total successful referrals for this user
    const totalReferrals = await db.query(
      `SELECT COUNT(*) as count 
       FROM referrals 
       WHERE referrer_id = ? AND status = 'converted'`,
      [referrerId]
    );

    const totalCount = totalReferrals[0].count;

    // Define reward tiers
    const rewardTiers = [
      { invites: 1, title: "Early access to new features", type: "digital" },
      { invites: 3, title: "Creator Spotlight feature", type: "status" },
      { invites: 5, title: "Ambassador Badge + Priority Support", type: "status" },
      { invites: 10, title: "Premium Analytics + Newsletter Feature", type: "service" },
      { invites: 50, title: "Free Nisapoti T-shirt + Sticker", type: "physical" },
      { invites: 100, title: "Creator Starter Kit", type: "physical" },
      { invites: 250, title: "Pro Creator Pack", type: "physical" },
      { invites: 500, title: "Big Creator Reward", type: "physical" }
    ];

    // Check which rewards should be unlocked
    for (const tier of rewardTiers) {
      if (totalCount >= tier.invites) {
        // Check if this reward is already unlocked
        const existingReward = await db.query(
          `SELECT id FROM referral_reward_tiers 
           WHERE user_id = ? AND invites_required = ?`,
          [referrerId, tier.invites]
        );

        if (existingReward.length === 0) {
          // Create new reward tier record
          await db.execute(
            `INSERT INTO referral_reward_tiers 
             (user_id, tier_level, invites_required, reward_title, reward_type, status, unlocked_at) 
             VALUES (?, ?, ?, ?, ?, 'unlocked', NOW())`,
            [referrerId, tier.invites, tier.invites, tier.title, tier.type]
          );
        }
      }
    }
  } catch (error) {
    console.error('Error checking and unlocking rewards:', error);
  }
}

