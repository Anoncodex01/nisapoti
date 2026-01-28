import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorId = searchParams.get('creator_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!creatorId) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      );
    }

    // Fetch withdrawal history with pagination
    const withdrawalsQuery = `
      SELECT 
        id,
        amount,
        payment_method,
        status,
        phone_number,
        bank_name,
        account_number,
        full_name,
        created_at,
        updated_at
      FROM withdrawals 
      WHERE creator_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const withdrawals = await db.query(withdrawalsQuery, [creatorId, limit, offset]);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total_count
      FROM withdrawals 
      WHERE creator_id = ?
    `;
    const countResult = await db.queryOne(countQuery, [creatorId]);
    const totalCount = countResult?.total_count || 0;

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals,
      pagination: {
        current_page: Math.floor(offset / limit) + 1,
        total_pages: totalPages,
        total_count: totalCount,
        limit: limit,
        offset: offset
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch withdrawal history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
