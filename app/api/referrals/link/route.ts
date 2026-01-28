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
    const username = decoded.username || decoded.display_name || 'user';

    // Generate referral link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/ref/${username}`;

    // Fetch stats from DB
    const statsRows = await db.query(
      `SELECT 
         COUNT(*) as total_invites,
         COUNT(CASE WHEN status = 'converted' THEN 1 END) as total_conversions
       FROM referrals
       WHERE referrer_user_id = ?`,
      [userId]
    );
    const stats = statsRows[0] || { total_invites: 0, total_conversions: 0 };
    const conversion_rate = stats.total_invites > 0 
      ? Math.round((stats.total_conversions / stats.total_invites) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        referralLink,
        stats: {
          total_invites: stats.total_invites || 0,
          total_conversions: stats.total_conversions || 0,
          conversion_rate
        }
      }
    });

  } catch (error) {
    console.error('Error generating referral link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
