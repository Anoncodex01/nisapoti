import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { snippe } from '@/lib/snippe';

export const dynamic = 'force-dynamic';

/**
 * Process successful payment completion
 */
async function processSuccessfulPayment(
  pendingPayment: any,
  paymentData: any
) {
  try {
    // Update pending payment status
    await db.execute(
      `UPDATE pending_payments 
       SET status = 'completed', 
           updated_at = NOW(),
           transaction_id = ?
       WHERE deposit_id = ?`,
      [paymentData.reference, pendingPayment.deposit_id]
    );

    // Handle different payment types
    if (pendingPayment.type === 'shop') {
      // Update order status to 'paid'
      await db.execute(
        `UPDATE orders 
         SET payment_status = 'paid',
             updated_at = NOW()
         WHERE payment_reference = ?`,
        [pendingPayment.payment_reference]
      );
      
      // Get order details for email
      const order = await db.queryOne(
        'SELECT * FROM orders WHERE payment_reference = ?',
        [pendingPayment.payment_reference]
      );
      
      // Send purchase confirmation email with product file/content
      if (order) {
        try {
          // Use internal API call instead of fetch to avoid CORS issues
          const emailResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/email/send-purchase-confirmation`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: order.id,
                depositId: pendingPayment.deposit_id,
              }),
            }
          );
          
          const emailResult = await emailResponse.json();
          
          if (emailResponse.ok && emailResult.success) {
            console.log('✅ Purchase confirmation email sent:', {
              orderId: order.id,
              buyerEmail: order.buyer_email,
            });
          } else {
            console.error('❌ Failed to send purchase confirmation email:', {
              status: emailResponse.status,
              error: emailResult.error,
              orderId: order.id,
            });
          }
        } catch (emailError) {
          console.error('❌ Error sending purchase confirmation email:', {
            error: emailError instanceof Error ? emailError.message : 'Unknown error',
            orderId: order?.id,
          });
          // Don't fail the payment processing if email fails
        }
      } else {
        console.warn('⚠️ Order not found for email sending:', {
          paymentReference: pendingPayment.payment_reference,
        });
      }
      
      console.log('✅ Shop order payment processed:', {
        depositId: pendingPayment.deposit_id,
        paymentReference: pendingPayment.payment_reference,
      });
    } else {
      // Insert into supporters table for support/wishlist
      // Use the original payment created_at to preserve the actual support time
      const supporterQuery = `
        INSERT INTO supporters (
          creator_id, name, phone, amount, type, wishlist_id, status, deposit_id, transaction_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?, COALESCE(?, NOW()))
      `;

      await db.execute(supporterQuery, [
        pendingPayment.creator_id,
        pendingPayment.supporter_name || 'Anonymous',
        pendingPayment.phone_number || '',
        pendingPayment.amount,
        pendingPayment.type || 'support',
        pendingPayment.wishlist_id || null,
        pendingPayment.deposit_id,
        paymentData.reference,
        pendingPayment.created_at, // Use original payment timestamp
      ]);

      // If it's a wishlist support, update wishlist amount_funded
      if (pendingPayment.wishlist_id) {
        await db.execute(
          `UPDATE wishlist 
           SET amount_funded = amount_funded + ?,
               updated_at = NOW()
           WHERE id = ?`,
          [pendingPayment.amount, pendingPayment.wishlist_id]
        );
      }
    }

    console.log('✅ Payment processed successfully:', {
      depositId: pendingPayment.deposit_id,
      amount: pendingPayment.amount,
      creatorId: pendingPayment.creator_id,
    });

    return { success: true, isCompleted: true };
  } catch (error) {
    console.error('❌ Error processing successful payment:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const depositId = searchParams.get('depositId');

    if (!depositId) {
      return NextResponse.json(
        { success: false, error: 'Deposit ID is required' },
        { status: 400 }
      );
    }

    // Get payment details from database
    const pendingPayment = await db.queryOne(
      'SELECT * FROM pending_payments WHERE deposit_id = ?',
      [depositId]
    );

    if (!pendingPayment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // If already completed in database, return immediately with order/product data for shop
    if (pendingPayment.status === 'completed') {
      let orderData = null;
      if (pendingPayment.type === 'shop' && pendingPayment.payment_reference) {
        // Get order with product details
        const order = await db.queryOne(
          `SELECT 
            o.*,
            p.file_url,
            p.content_url,
            p.redirect_url,
            p.confirmation_message,
            p.success_page_type,
            p.feature_image_url,
            p.description
          FROM orders o
          JOIN products p ON o.product_id = p.id
          WHERE o.payment_reference = ?`,
          [pendingPayment.payment_reference]
        );
        orderData = order;
      }
      
      return NextResponse.json({
        success: true,
        isCompleted: true,
        status: 'completed',
        depositId: pendingPayment.deposit_id,
        pendingPayment: pendingPayment,
        order: orderData,
      });
    }

    // If failed in database, return immediately
    if (pendingPayment.status === 'failed') {
      return NextResponse.json({
        success: true,
        isCompleted: false,
        status: 'failed',
        depositId: pendingPayment.deposit_id,
      });
    }

    // Check status with Snippe if we have a payment reference
    if (pendingPayment.payment_reference && pendingPayment.payment_provider === 'snippe') {
      const statusResult = await snippe.getPaymentStatus(pendingPayment.payment_reference);

      if (statusResult.status === 'success' && statusResult.data) {
        const paymentData = statusResult.data;

        // If payment is completed, process it
        if (paymentData.status === 'completed') {
          await processSuccessfulPayment(pendingPayment, paymentData);
          
          // Get order with product details for shop purchases
          let orderData = null;
          if (pendingPayment.type === 'shop' && pendingPayment.payment_reference) {
            const order = await db.queryOne(
              `SELECT 
                o.*,
                p.file_url,
                p.content_url,
                p.redirect_url,
                p.confirmation_message,
                p.success_page_type,
                p.feature_image_url,
                p.description
              FROM orders o
              JOIN products p ON o.product_id = p.id
              WHERE o.payment_reference = ?`,
              [pendingPayment.payment_reference]
            );
            orderData = order;
          }
          
          return NextResponse.json({
            success: true,
            isCompleted: true,
            status: 'completed',
            depositId: pendingPayment.deposit_id,
            pendingPayment: pendingPayment,
            order: orderData,
          });
        }

        // If payment failed, update database with failure reason
        if (paymentData.status === 'failed') {
          const data = paymentData as typeof paymentData & { failure_reason?: string; error?: string; channel?: { error?: string } };
          const failureReason = data.failure_reason ||
                               data.error ||
                               data.channel?.error ||
                               'Payment failed';
          
          console.error('❌ Payment failed - updating database:', {
            depositId: pendingPayment.deposit_id,
            reference: paymentData.reference,
            failureReason: failureReason,
            channel: paymentData.channel,
          });
          
          await db.execute(
            `UPDATE pending_payments 
             SET status = 'failed', 
                 failure_reason = ?,
                 updated_at = NOW()
             WHERE deposit_id = ?`,
            [failureReason, pendingPayment.deposit_id]
          );
          return NextResponse.json({
            success: true,
            isCompleted: false,
            status: 'failed',
            depositId: pendingPayment.deposit_id,
            failureReason: failureReason,
          });
        }

        // Payment still pending
        return NextResponse.json({
          success: true,
          isCompleted: false,
          status: paymentData.status,
          depositId: pendingPayment.deposit_id,
        });
      }
    }

    // Return current database status
    return NextResponse.json({
      success: true,
      isCompleted: pendingPayment.status === 'completed',
      status: pendingPayment.status,
      depositId: pendingPayment.deposit_id,
    });

  } catch (error) {
    console.error('Check payment status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check payment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
