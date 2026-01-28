import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const orderResult = await db.execute(
      `INSERT INTO orders (
        order_number, creator_id, buyer_email, buyer_name, 
        product_id, product_title, quantity, unit_price, total_amount, 
        payment_status, deposit_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'paid', ?, NOW())`,
      [
        orderNumber,
        'cb3348d3-89aa-49a5-a7a3-321dae2bd8af', // creator_id
        '255775228897@mobile.money', // buyer_email
        'Test Buyer', // buyer_name
        4, // product_id
        'Test Product', // product_title
        1, // quantity
        1000.00, // unit_price
        1000.00, // total_amount
        'test-deposit-id' // deposit_id
      ]
    );
    
    return NextResponse.json({
      success: true,
      data: {
        orderResult,
        orderNumber
      }
    });
  } catch (error) {
    console.error('Create test order error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
