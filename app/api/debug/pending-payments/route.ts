import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const pendingPayments = await db.query('SELECT * FROM pending_payments ORDER BY created_at DESC LIMIT 10');
    
    return NextResponse.json({
      success: true,
      data: {
        pendingPayments: pendingPayments,
        count: pendingPayments.length
      }
    });
  } catch (error) {
    console.error('Debug pending payments error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending payments' },
      { status: 500 }
    );
  }
}
