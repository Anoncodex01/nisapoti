import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { snippe } from '@/lib/snippe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const withdrawalId = searchParams.get('withdrawal_id');

    if (!withdrawalId) {
      return NextResponse.json(
        { error: 'Withdrawal ID is required' },
        { status: 400 }
      );
    }

    // Get withdrawal from database
    const withdrawal = await db.queryOne(
      'SELECT * FROM withdrawals WHERE id = ?',
      [withdrawalId]
    );

    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal not found' },
        { status: 404 }
      );
    }

    // If already completed or cancelled, return current status
    if (withdrawal.status === 'COMPLETED' || withdrawal.status === 'CANCELLED') {
      return NextResponse.json({
        success: true,
        status: withdrawal.status,
        withdrawal: withdrawal
      });
    }

    // If no payout reference, can't check status
    if (!withdrawal.payout_reference) {
      return NextResponse.json({
        success: true,
        status: withdrawal.status,
        withdrawal: withdrawal
      });
    }

    // Check payout status from Snippe
    try {
      const payoutStatus = await snippe.getPayoutStatus(withdrawal.payout_reference);

      if (payoutStatus.status === 'success' && payoutStatus.data) {
        const payoutData = payoutStatus.data as any;
        const payoutStatusValue = payoutData.status;

        // Update withdrawal status based on Snippe status
        if (payoutStatusValue === 'completed' && withdrawal.status !== 'COMPLETED') {
          await db.execute(
            `UPDATE withdrawals 
             SET status = 'COMPLETED',
                 updated_at = NOW()
             WHERE id = ?`,
            [withdrawalId]
          );
          
          console.log('✅ Withdrawal status updated to COMPLETED:', {
            withdrawalId,
            payoutReference: withdrawal.payout_reference,
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
                withdrawalId,
                phoneNumber: withdrawal.phone_number.substring(0, 6) + '***',
              });
            } catch (smsError) {
              console.error('❌ Failed to send SMS notification for withdrawal:', {
                withdrawalId,
                error: smsError instanceof Error ? smsError.message : 'Unknown error',
              });
              // Don't fail the status check if SMS fails
            }
          }

          return NextResponse.json({
            success: true,
            status: 'COMPLETED',
            withdrawal: {
              ...withdrawal,
              status: 'COMPLETED'
            }
          });
        } else if (payoutStatusValue === 'failed' && withdrawal.status !== 'CANCELLED') {
          await db.execute(
            `UPDATE withdrawals 
             SET status = 'CANCELLED',
                 updated_at = NOW()
             WHERE id = ?`,
            [withdrawalId]
          );

          return NextResponse.json({
            success: true,
            status: 'CANCELLED',
            withdrawal: {
              ...withdrawal,
              status: 'CANCELLED'
            }
          });
        }
      }
    } catch (error) {
      console.error('❌ Error checking payout status:', error);
      // Don't fail the request if status check fails
    }

    // Return current status
    return NextResponse.json({
      success: true,
      status: withdrawal.status,
      withdrawal: withdrawal
    });

  } catch (error) {
    console.error('❌ Error checking withdrawal status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check withdrawal status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
