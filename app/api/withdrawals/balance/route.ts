import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creator_id');

    if (!creatorId) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      );
    }

    // Calculate available balance using the same logic as PHP:
    // Available Balance = Direct support + Fully funded wishlists - Withdrawals
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
    const availableBalanceResult = await db.queryOne(availableBalanceQuery, [creatorId, creatorId, creatorId]);
    const availableBalance = parseFloat(availableBalanceResult?.available_balance || '0');

    // Calculate locked funds (wishlist payments for not yet fully funded wishlists)
    const lockedFundsQuery = `
      SELECT COALESCE(SUM(s.amount), 0) as locked
      FROM supporters s
      JOIN wishlist w ON s.wishlist_id = w.id
      WHERE s.creator_id = ? AND s.type = 'wishlist' AND w.amount_funded < w.price AND s.status = 'completed'
    `;
    const lockedFundsResult = await db.queryOne(lockedFundsQuery, [creatorId]);
    const lockedFunds = parseFloat(lockedFundsResult?.locked || '0');

    // Calculate total withdrawals
    const withdrawalsQuery = `
      SELECT COALESCE(SUM(amount), 0) as total_withdrawals
      FROM withdrawals 
      WHERE creator_id = ? AND status != 'CANCELLED'
    `;
    const withdrawalsResult = await db.queryOne(withdrawalsQuery, [creatorId]);
    const totalWithdrawals = parseFloat(withdrawalsResult?.total_withdrawals || '0');

    const balanceData = {
      available_balance: availableBalance,
      locked_funds: lockedFunds,
      total_withdrawals: totalWithdrawals
    };

    return NextResponse.json(balanceData);

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch balance data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
