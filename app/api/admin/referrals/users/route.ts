import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Check if user is admin (you can implement your own admin check logic)
    // For now, we'll assume any authenticated user can access this
    // In production, you should check user roles/permissions

    // Get referral users with their statistics
    const users = await db.query(
      `SELECT 
         u.id,
         u.email,
         p.username,
         p.display_name,
         COUNT(r.id) as total_referrals,
         SUM(CASE WHEN r.status = 'converted' THEN 1 ELSE 0 END) as successful_referrals,
         COUNT(rt.id) as unlocked_rewards,
         MAX(r.created_at) as last_referral,
         u.created_at
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       LEFT JOIN referrals r ON u.id = r.referrer_id
       LEFT JOIN referral_reward_tiers rt ON u.id = rt.user_id
       WHERE u.id IN (SELECT DISTINCT referrer_id FROM referrals)
       GROUP BY u.id, u.email, p.username, p.display_name, u.created_at
       ORDER BY successful_referrals DESC, total_referrals DESC`
    );

    return NextResponse.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Error fetching referral users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

