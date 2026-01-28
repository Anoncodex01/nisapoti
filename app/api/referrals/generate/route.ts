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
    const userId = decoded.userId;

    const { type = 'creator', customCode = null } = await request.json();

    // Generate unique referral code
    let referralCode;
    if (customCode) {
      // Check if custom code is available
      const existingCode = await db.query(
        'SELECT id FROM referral_codes WHERE code = ?',
        [customCode]
      );
      
      if (existingCode.length > 0) {
        return NextResponse.json({ error: 'Code already exists' }, { status: 400 });
      }
      referralCode = customCode;
    } else {
      // Generate random code
      const userProfile = await db.query(
        'SELECT username FROM profiles WHERE user_id = ?',
        [userId]
      );
      
      const username = userProfile[0]?.username || 'user';
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      referralCode = `${username}${randomSuffix}`;
    }

    // Create referral code
    const result = await db.execute(
      `INSERT INTO referral_codes (user_id, code, type, reward_percentage) 
       VALUES (?, ?, ?, ?)`,
      [userId, referralCode, type, 10.00]
    );

    const referralCodeId = result.insertId;

    return NextResponse.json({
      success: true,
      data: {
        id: referralCodeId,
        code: referralCode,
        type,
        referralUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/ref/${referralCode}`,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/ref/${referralCode}`)}`
      }
    });

  } catch (error) {
    console.error('Error generating referral code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
