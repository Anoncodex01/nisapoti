import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { snippe } from '@/lib/snippe';

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
      amount, 
      payment_method, 
      full_name, 
      phone_number, 
      bank_name, 
      account_number,
      provider // Mobile money provider: 'Tigo', 'Airtel', 'M-Pesa', 'Halotel'
    } = body;

    // Validate required fields
    if (!creator_id || !amount || !payment_method || !full_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Validate minimum withdrawal amount (removed for testing - allow any amount > 0)
    if (parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Withdrawal amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate payment method specific fields
    if (payment_method === 'mobile') {
      if (!phone_number) {
        return NextResponse.json(
          { error: 'Phone number is required for mobile payments' },
          { status: 400 }
        );
      }
      if (!provider) {
        return NextResponse.json(
          { error: 'Mobile money provider is required' },
          { status: 400 }
        );
      }
    }

    if (payment_method === 'bank' && (!bank_name || !account_number)) {
      return NextResponse.json(
        { error: 'Bank name and account number are required for bank transfers' },
        { status: 400 }
      );
    }

    // Check available balance using the same logic as PHP
    const availableBalanceQuery = `
      SELECT (
        (SELECT COALESCE(SUM(amount), 0) FROM supporters WHERE creator_id = ? AND type = 'support' AND status = 'completed')
        +
        (SELECT COALESCE(SUM(s.amount), 0)
         FROM supporters s
         JOIN wishlist w ON s.wishlist_id = w.id
         WHERE s.creator_id = ? AND s.type = 'wishlist' AND w.amount_funded >= w.price AND s.status = 'completed')
        -
        (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE creator_id = ? AND status != 'CANCELLED')
      ) AS available_balance
    `;
    const availableBalanceResult = await db.queryOne(availableBalanceQuery, [creator_id, creator_id, creator_id]);
    const availableBalance = parseFloat(availableBalanceResult?.available_balance || '0');

    const withdrawalAmount = parseFloat(amount);
    
    if (withdrawalAmount > availableBalance) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Calculate commission (18%)
    const commission = withdrawalAmount * 0.18;
    const netAmount = withdrawalAmount - commission;

    // Create withdrawal record first
    const withdrawalId = uuidv4();

    // For mobile money, process payout immediately via Snippe
    if (payment_method === 'mobile') {
      try {
        // Create payout with Snippe
        const payoutResult = await snippe.createPayout({
          amount: Math.round(netAmount), // Amount after commission (in TZS smallest unit)
          channel: 'mobile',
          recipient_phone: phone_number,
          recipient_name: full_name,
          narration: `Withdrawal from Nisapoti - ${provider}`,
          webhook_url: process.env.SNIPPE_WEBHOOK_URL,
          metadata: {
            withdrawal_id: withdrawalId,
            creator_id: creator_id,
            original_amount: withdrawalAmount,
            commission: commission,
            provider: provider,
          },
        });

        if (payoutResult.status !== 'success' || !payoutResult.data) {
          console.error('❌ Snippe payout creation failed:', payoutResult);
          return NextResponse.json(
            { 
              error: payoutResult.message || 'Failed to initiate payout. Please try again.',
              details: payoutResult
            },
            { status: 400 }
          );
        }

        const payoutData = payoutResult.data as any;
        const payoutReference = payoutData.reference || payoutData.id || payoutData.payout_id;

        // Create withdrawal record with payout reference
        const insertQuery = `
          INSERT INTO withdrawals (
            id, creator_id, amount, payment_method, status, 
            phone_number, bank_name, account_number, full_name,
            payout_reference, provider, commission_amount, net_amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // All withdrawals are instant (M-Pesa removed)
        const initialStatus = 'PROCESSING';

        await db.execute(insertQuery, [
          withdrawalId,
          creator_id,
          withdrawalAmount,
          payment_method,
          initialStatus,
          phone_number || null,
          bank_name || null,
          account_number || null,
          full_name,
          payoutReference,
          provider || null,
          commission,
          netAmount,
        ]);

        console.log('✅ Withdrawal payout initiated:', {
          withdrawalId,
          payoutReference,
          amount: withdrawalAmount,
          commission,
          netAmount,
          provider,
          status: initialStatus,
        });

        // Return success message
        const message = 'Your withdrawal is being processed instantly. Funds will be transferred to your mobile wallet shortly.';

        return NextResponse.json({
          success: true,
          withdrawal_id: withdrawalId,
          payout_reference: payoutReference,
          instant: provider !== 'M-Pesa',
          message: message,
        });

      } catch (error) {
        console.error('❌ Error creating payout:', error);
        return NextResponse.json(
          { 
            error: 'Failed to process withdrawal',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500 }
        );
      }
    }

    // For bank transfers, create pending withdrawal (not implemented yet)
    const insertQuery = `
      INSERT INTO withdrawals (
        id, creator_id, amount, payment_method, status, 
        phone_number, bank_name, account_number, full_name,
        commission_amount, net_amount
      ) VALUES (?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(insertQuery, [
      withdrawalId,
      creator_id,
      withdrawalAmount,
      payment_method,
      phone_number || null,
      bank_name || null,
      account_number || null,
      full_name,
      commission,
      netAmount,
    ]);

    return NextResponse.json({
      success: true,
      withdrawal_id: withdrawalId,
      message: 'Withdrawal request submitted successfully. Bank transfers may take 1-3 business days.'
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to submit withdrawal request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
