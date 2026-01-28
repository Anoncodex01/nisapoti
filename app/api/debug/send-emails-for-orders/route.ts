import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Get recent orders that might not have received emails
    const orders = await db.query(
      'SELECT * FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) ORDER BY created_at DESC'
    );

    const results = [];

    for (const order of orders) {
      try {
        const emailResponse = await fetch(`http://localhost:3000/api/email/send-purchase-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id })
        });

        const emailResult = await emailResponse.json();
        
        results.push({
          orderId: order.id,
          orderNumber: order.order_number,
          buyerEmail: order.buyer_email,
          productTitle: order.product_title,
          emailSent: emailResult.success,
          emailError: emailResult.error || null
        });

        console.log(`📧 Email for order ${order.order_number}:`, emailResult.success ? 'Sent' : 'Failed');
      } catch (error) {
        results.push({
          orderId: order.id,
          orderNumber: order.order_number,
          buyerEmail: order.buyer_email,
          productTitle: order.product_title,
          emailSent: false,
          emailError: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${orders.length} orders`,
      results: results
    });

  } catch (error) {
    console.error('Send emails for orders error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
