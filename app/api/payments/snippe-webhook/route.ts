import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { SnippeService } from '@/lib/snippe';

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
            console.log('✅ Purchase confirmation email sent via webhook:', {
              orderId: order.id,
              buyerEmail: order.buyer_email,
            });
          } else {
            console.error('❌ Failed to send purchase confirmation email via webhook:', {
              status: emailResponse.status,
              error: emailResult.error,
              orderId: order.id,
            });
          }
        } catch (emailError) {
          console.error('❌ Error sending purchase confirmation email via webhook:', {
            error: emailError instanceof Error ? emailError.message : 'Unknown error',
            orderId: order?.id,
          });
          // Don't fail the payment processing if email fails
        }
      } else {
        console.warn('⚠️ Order not found for email sending via webhook:', {
          paymentReference: pendingPayment.payment_reference,
        });
      }
      
      console.log('✅ Shop order payment processed via webhook:', {
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

    return { success: true };
  } catch (error) {
    console.error('❌ Error processing successful payment:', error);
    throw error;
  }
}

/**
 * Process failed payment
 */
async function processFailedPayment(
  pendingPayment: any,
  paymentData: any
) {
  try {
    // Update pending payment status
    await db.execute(
      `UPDATE pending_payments 
       SET status = 'failed', 
           updated_at = NOW(),
           failure_reason = ?
       WHERE deposit_id = ?`,
      [paymentData.failure_reason || 'Payment failed', pendingPayment.deposit_id]
    );

    console.log('❌ Payment failed:', {
      depositId: pendingPayment.deposit_id,
      reason: paymentData.failure_reason,
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Error processing failed payment:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get webhook headers
    const eventType = request.headers.get('X-Webhook-Event');
    const timestamp = request.headers.get('X-Webhook-Timestamp');
    const signature = request.headers.get('X-Webhook-Signature');

    console.log('📥 Snippe webhook received:', {
      eventType,
      timestamp,
      hasSignature: !!signature,
    });

    const body = await request.json();
    console.log('📥 Webhook payload:', JSON.stringify(body, null, 2));

    // Verify webhook signature (optional but recommended)
    // For now, we'll process the webhook
    // TODO: Implement signature verification

    const { type, data } = body;

    if (!data || !data.reference) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Handle payout events (withdrawals)
    if (type === 'payout.completed' || type === 'payout.failed') {
      // Try multiple reference formats
      const reference = data.reference || data.id || data.payout_id || data.external_reference;
      
      if (!reference) {
        console.error('❌ No reference found in payout webhook:', JSON.stringify(data, null, 2));
        return NextResponse.json(
          { error: 'No reference in webhook data' },
          { status: 400 }
        );
      }

      console.log('🔍 Looking for withdrawal with payout reference:', reference);

      // Find withdrawal by payout reference (try different formats)
      let withdrawal = await db.queryOne(
        `SELECT * FROM withdrawals 
         WHERE payout_reference = ?`,
        [reference]
      );

      // If not found, try with external_reference from metadata
      if (!withdrawal && data.metadata?.withdrawal_id) {
        withdrawal = await db.queryOne(
          `SELECT * FROM withdrawals 
           WHERE id = ?`,
          [data.metadata.withdrawal_id]
        );
      }

      if (!withdrawal) {
        console.warn('⚠️ Withdrawal not found for payout reference:', {
          reference,
          allReferences: {
            reference: data.reference,
            id: data.id,
            payout_id: data.payout_id,
            external_reference: data.external_reference,
            metadata: data.metadata
          }
        });
        return NextResponse.json(
          { error: 'Withdrawal not found' },
          { status: 404 }
        );
      }

      // Update withdrawal status
      if (type === 'payout.completed' || data.status === 'completed') {
        await db.execute(
          `UPDATE withdrawals 
           SET status = 'COMPLETED',
               updated_at = NOW()
           WHERE id = ?`,
          [withdrawal.id]
        );
        console.log('✅ Payout completed:', {
          withdrawalId: withdrawal.id,
          payoutReference: reference,
          amount: withdrawal.amount,
          webhookData: {
            type,
            status: data.status,
            reference: data.reference,
            id: data.id,
          }
        });

        // Send SMS notification for completed withdrawal
        if (withdrawal.phone_number && withdrawal.full_name) {
          try {
            const { smsService } = await import('@/lib/sms');
            const message = smsService.getWithdrawalCompletedMessage(
              withdrawal.full_name,
              withdrawal.net_amount || withdrawal.amount
            );
            
            await smsService.sendSingleSMS(withdrawal.phone_number, message);
            console.log('✅ SMS notification sent for completed withdrawal:', {
              withdrawalId: withdrawal.id,
              phoneNumber: withdrawal.phone_number.substring(0, 6) + '***',
            });
          } catch (smsError) {
            console.error('❌ Failed to send SMS notification for withdrawal:', {
              withdrawalId: withdrawal.id,
              error: smsError instanceof Error ? smsError.message : 'Unknown error',
            });
            // Don't fail the webhook if SMS fails
          }
        }
      } else if (type === 'payout.failed' || data.status === 'failed') {
        await db.execute(
          `UPDATE withdrawals 
           SET status = 'CANCELLED',
               updated_at = NOW()
           WHERE id = ?`,
          [withdrawal.id]
        );
        console.log('❌ Payout failed:', {
          withdrawalId: withdrawal.id,
          payoutReference: reference,
          failureReason: data.failure_reason,
          webhookData: {
            type,
            status: data.status,
            reference: data.reference,
            id: data.id,
          }
        });
      }

      return NextResponse.json({ success: true });
    }

    // Handle payment events (deposits)
    // Find pending payment by Snippe reference
    const pendingPayment = await db.queryOne(
      `SELECT * FROM pending_payments 
       WHERE payment_reference = ? AND payment_provider = 'snippe'`,
      [data.reference]
    );

    if (!pendingPayment) {
      console.warn('⚠️ Pending payment not found for reference:', data.reference);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Process based on event type
    if (type === 'payment.completed' || data.status === 'completed') {
      await processSuccessfulPayment(pendingPayment, data);
    } else if (type === 'payment.failed' || data.status === 'failed') {
      await processFailedPayment(pendingPayment, data);
    } else {
      // Update status for other statuses (pending, expired, voided)
      await db.execute(
        `UPDATE pending_payments 
         SET status = ?, 
             updated_at = NOW()
         WHERE deposit_id = ?`,
        [data.status, pendingPayment.deposit_id]
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
