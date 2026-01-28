import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

        // Get real referral data from database
        const referralStats = await db.query(
          `SELECT 
             COUNT(*) as total_referrals,
             COUNT(CASE WHEN status = 'converted' THEN 1 END) as conversions,
             COALESCE(SUM(conversion_value), 0) as total_revenue
           FROM referrals 
           WHERE referrer_user_id = ?`,
          [userId]
        );

        const recentReferralsData = await db.query(
          `SELECT r.*, p.username, p.display_name, p.avatar_url
           FROM referrals r
           LEFT JOIN profiles p ON r.referred_user_id = p.user_id
           WHERE r.referrer_user_id = ?
           ORDER BY r.created_at DESC
           LIMIT 10`,
          [userId]
        );

        const stats = {
          total_referrals: referralStats[0]?.total_referrals || 0,
          conversions: referralStats[0]?.conversions || 0,
          total_revenue: referralStats[0]?.total_revenue || 0,
          total_rewards: (referralStats[0]?.total_revenue || 0) * 0.1, // 10% reward
          recent_referrals: recentReferralsData.length
        };

        const referralCodes = [{
          id: 'main-code',
          code: decoded.username || 'Alvin',
          type: 'username',
          total_uses: stats.total_referrals,
          reward_percentage: 10,
          created_at: new Date().toISOString(),
          expires_at: null
        }];

        const recentReferrals = recentReferralsData.map(ref => ({
          id: ref.id,
          username: ref.username || 'Anonymous',
          display_name: ref.display_name || 'Anonymous User',
          avatar_url: ref.avatar_url,
          status: ref.status,
          created_at: ref.created_at,
          conversion_value: ref.conversion_value || 0
        }));

        const monthlyEarnings: any[] = [];
        const pendingRewards = { total_pending: stats.total_rewards };

    return NextResponse.json({
      success: true,
      data: {
        codes: referralCodes,
        stats,
        recentReferrals,
        monthlyEarnings,
        pendingRewards: pendingRewards.total_pending || 0
      }
    });

  } catch (error) {
    console.error('Error fetching referral earnings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
