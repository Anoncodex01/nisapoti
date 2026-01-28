import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const jwtSecret = JWT_SECRET as string;

async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }
    
    const decoded = jwt.verify(token, jwtSecret) as any;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      creator_id, 
      provider, 
      full_name, 
      phone_number 
    } = body;

    // Validate required fields
    if (!creator_id || !provider || !full_name || !phone_number) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Verify the creator_id matches the authenticated user
    if (user.userId !== creator_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if payment info already exists (handle case where table doesn't exist yet)
    let existingInfo = null;
    try {
      existingInfo = await db.queryOne(
        'SELECT * FROM verified_payment_info WHERE creator_id = ?',
        [creator_id]
      );
    } catch (error: any) {
      // If table doesn't exist, create it first
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.error('❌ verified_payment_info table does not exist. Please run the migration: database/add_verified_payment_info.sql');
        return NextResponse.json(
          { error: 'Database table not found. Please contact support.' },
          { status: 500 }
        );
      }
      throw error;
    }

    if (existingInfo && existingInfo.is_verified) {
      return NextResponse.json(
        { error: 'Payment information is already verified and cannot be changed. Please contact support if you need to update it.' },
        { status: 400 }
      );
    }

    // Format phone number
    let formattedPhone = phone_number.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '255' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('255')) {
      formattedPhone = '255' + formattedPhone;
    }

    if (existingInfo) {
      // Update existing unverified info
      await db.execute(
        `UPDATE verified_payment_info 
         SET provider = ?, 
             full_name = ?, 
             phone_number = ?,
             is_verified = TRUE,
             verified_at = NOW(),
             updated_at = NOW()
         WHERE creator_id = ?`,
        [provider, full_name, formattedPhone, creator_id]
      );
    } else {
      // Create new verified payment info
      const id = uuidv4();
      await db.execute(
        `INSERT INTO verified_payment_info 
         (id, creator_id, provider, full_name, phone_number, is_verified, verified_at)
         VALUES (?, ?, ?, ?, ?, TRUE, NOW())`,
        [id, creator_id, provider, full_name, formattedPhone]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment information verified successfully'
    });

  } catch (error) {
    console.error('Error verifying payment info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to verify payment information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creator_id');

    if (!creatorId) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      );
    }

    // Verify the creator_id matches the authenticated user
    if (user.userId !== creatorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get payment info (handle case where table doesn't exist yet)
    let paymentInfo = null;
    try {
      paymentInfo = await db.queryOne(
        'SELECT * FROM verified_payment_info WHERE creator_id = ?',
        [creatorId]
      );
    } catch (error: any) {
      // If table doesn't exist, return no payment info
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.warn('⚠️ verified_payment_info table does not exist. Please run the migration: database/add_verified_payment_info.sql');
        return NextResponse.json({
          success: true,
          hasPaymentInfo: false,
          paymentInfo: null
        });
      }
      throw error;
    }

    if (!paymentInfo) {
      return NextResponse.json({
        success: true,
        hasPaymentInfo: false,
        paymentInfo: null
      });
    }

    return NextResponse.json({
      success: true,
      hasPaymentInfo: true,
      paymentInfo: {
        id: paymentInfo.id,
        provider: paymentInfo.provider,
        full_name: paymentInfo.full_name,
        phone_number: paymentInfo.phone_number,
        is_verified: paymentInfo.is_verified,
        verified_at: paymentInfo.verified_at,
        created_at: paymentInfo.created_at
      }
    });

  } catch (error) {
    console.error('Error fetching payment info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch payment information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
