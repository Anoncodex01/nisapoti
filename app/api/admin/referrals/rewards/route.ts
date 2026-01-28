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

    // Get reward tiers with user information
    const rewards = await db.query(
      `SELECT 
         rt.*,
         p.username,
         p.display_name,
         u.email
       FROM referral_reward_tiers rt
       JOIN users u ON rt.user_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       ORDER BY rt.unlocked_at DESC, rt.tier_level ASC`
    );

    return NextResponse.json({
      success: true,
      data: rewards
    });

  } catch (error) {
    console.error('Error fetching reward tiers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

