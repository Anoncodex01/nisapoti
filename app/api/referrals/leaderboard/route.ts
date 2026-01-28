import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get top referrers by earnings
    const topEarners = await db.query(
      `SELECT 
         u.id,
         p.username,
         p.display_name,
         p.avatar_url,
         COUNT(r.id) as total_referrals,
         SUM(CASE WHEN r.status = 'converted' THEN 1 ELSE 0 END) as conversions,
         SUM(CASE WHEN r.status = 'converted' THEN r.reward_amount ELSE 0 END) as total_earnings,
         ROUND(
           (SUM(CASE WHEN r.status = 'converted' THEN 1 ELSE 0 END) / COUNT(r.id)) * 100, 2
         ) as conversion_rate
       FROM referrals r
       JOIN users u ON r.referrer_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY u.id, p.username, p.display_name, p.avatar_url
       HAVING total_referrals > 0
       ORDER BY total_earnings DESC
       LIMIT ?`,
      [period, limit]
    );

    // Get top referrers by volume
    const topVolume = await db.query(
      `SELECT 
         u.id,
         p.username,
         p.display_name,
         p.avatar_url,
         COUNT(r.id) as total_referrals,
         SUM(CASE WHEN r.status = 'converted' THEN 1 ELSE 0 END) as conversions,
         SUM(CASE WHEN r.status = 'converted' THEN r.reward_amount ELSE 0 END) as total_earnings
       FROM referrals r
       JOIN users u ON r.referrer_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY u.id, p.username, p.display_name, p.avatar_url
       HAVING total_referrals > 0
       ORDER BY total_referrals DESC
       LIMIT ?`,
      [period, limit]
    );

    // Get platform-wide stats
    const platformStats = await db.query(
      `SELECT 
         COUNT(DISTINCT referrer_id) as active_referrers,
         COUNT(*) as total_referrals,
         SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as total_conversions,
         SUM(CASE WHEN status = 'converted' THEN reward_amount ELSE 0 END) as total_rewards_paid,
         ROUND(
           (SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2
         ) as overall_conversion_rate
       FROM referrals 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [period]
    );

    return NextResponse.json({
      success: true,
      data: {
        topEarners,
        topVolume,
        platformStats: platformStats[0] || {
          active_referrers: 0,
          total_referrals: 0,
          total_conversions: 0,
          total_rewards_paid: 0,
          overall_conversion_rate: 0
        },
        period
      }
    });

  } catch (error) {
    console.error('Error fetching referral leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
