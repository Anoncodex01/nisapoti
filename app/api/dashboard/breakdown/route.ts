import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || '7 days';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get creator profile
    const profile = await db.queryOne(
      'SELECT user_id FROM profiles WHERE user_id = ?',
      [userId]
    );

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const creatorId = profile.user_id;

    // Build date filter based on period
    let dateFilter = '';
    switch (period) {
      case '7 days':
        dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case '30 days':
        dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      case 'All time':
        dateFilter = '';
        break;
    }

    // Fetch supporters data for the period
    const supportersQuery = `
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount
      FROM supporters 
      WHERE creator_id = ? AND status = 'completed' ${dateFilter}
    `;

    // Fetch wishlist support data for the period
    const wishlistQuery = `
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as amount
      FROM supporters 
      WHERE creator_id = ? AND status = 'completed' AND type = 'wishlist' ${dateFilter}
    `;

    // Fetch shop data for the period
    const shopQuery = `
      SELECT 
        COUNT(DISTINCT o.id) as count,
        COALESCE(SUM(o.total_amount), 0) as amount
      FROM orders o
      WHERE o.creator_id = ? AND o.payment_status = 'paid' ${dateFilter.replace('created_at', 'o.order_date')}
    `;

    // Execute all queries in parallel
    const [supportersResult, wishlistResult, shopResult] = await Promise.all([
      db.queryOne(supportersQuery, [creatorId]),
      db.queryOne(wishlistQuery, [creatorId]),
      db.queryOne(shopQuery, [creatorId])
    ]);

    const breakdown = {
      supporters: {
        count: parseInt(supportersResult?.count || '0'),
        amount: parseFloat(supportersResult?.amount || '0')
      },
      wishlist: {
        count: parseInt(wishlistResult?.count || '0'),
        amount: parseFloat(wishlistResult?.amount || '0')
      },
      shop: {
        count: parseInt(shopResult?.count || '0'),
        amount: parseFloat(shopResult?.amount || '0')
      }
    };

    return NextResponse.json({
      success: true,
      breakdown,
      period
    });

  } catch (error) {
    console.error('Error fetching period breakdown:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch period breakdown',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
