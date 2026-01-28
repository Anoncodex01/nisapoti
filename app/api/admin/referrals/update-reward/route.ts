import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const adminUserId = decoded.userId;

    const { rewardId, status, trackingNumber } = await request.json();

    if (!rewardId || !status) {
      return NextResponse.json({ error: 'Reward ID and status are required' }, { status: 400 });
    }

    // Update reward status
    let updateQuery = '';
    let updateParams: any[] = [];

    if (status === 'claimed') {
      updateQuery = 'UPDATE referral_reward_tiers SET status = ?, claimed_at = NOW() WHERE id = ?';
      updateParams = [status, rewardId];
    } else if (status === 'shipped') {
      updateQuery = 'UPDATE referral_reward_tiers SET status = ?, shipped_at = NOW(), tracking_number = ? WHERE id = ?';
      updateParams = [status, trackingNumber || null, rewardId];
    } else {
      updateQuery = 'UPDATE referral_reward_tiers SET status = ? WHERE id = ?';
      updateParams = [status, rewardId];
    }

    await db.execute(updateQuery, updateParams);

    // Log admin action
    await db.execute(
      `INSERT INTO referral_admin_actions (admin_user_id, target_user_id, action_type, reward_tier_id, notes) 
       VALUES (?, (SELECT user_id FROM referral_reward_tiers WHERE id = ?), 'unlock_reward', ?, ?)`,
      [adminUserId, rewardId, rewardId, `Status updated to ${status}${trackingNumber ? ` with tracking: ${trackingNumber}` : ''}`]
    );

    return NextResponse.json({
      success: true,
      message: 'Reward status updated successfully'
    });

  } catch (error) {
    console.error('Error updating reward status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

