import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const orders = await db.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10');
    
    return NextResponse.json({
      success: true,
      data: {
        orders: orders,
        count: orders.length
      }
    });
  } catch (error) {
    console.error('Debug orders error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
