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

    // Fetch supporters with pagination (include all supporters including wishlist)
    const supportersQuery = `
      SELECT 
        s.id,
        s.name,
        s.phone,
        s.amount,
        s.type,
        s.status,
        s.created_at,
        s.updated_at,
        w.name as wishlist_name,
        w.id as wishlist_id
      FROM supporters s
      LEFT JOIN wishlist w ON s.wishlist_id = w.id
      WHERE s.creator_id = ? AND s.status = 'completed'
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const supporters = await db.query(supportersQuery, [creatorId, limit, offset]);

    // Get total count for pagination (include all supporters)
    const countQuery = `
      SELECT COUNT(*) as total_count
      FROM supporters 
      WHERE creator_id = ? AND status = 'completed'
    `;
    const countResult = await db.queryOne(countQuery, [creatorId]);
    const totalCount = countResult?.total_count || 0;

    // Calculate stats (include all supporters including wishlist)
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN amount ELSE 0 END) as last_30_days,
        SUM(amount) as all_time
      FROM supporters 
      WHERE creator_id = ? AND status = 'completed'
    `;
    const statsResult = await db.queryOne(statsQuery, [creatorId]);

    const stats = {
      total: statsResult?.total || 0,
      last_30_days: parseFloat(statsResult?.last_30_days || '0'),
      all_time: parseFloat(statsResult?.all_time || '0')
    };

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      supporters: supporters,
      stats: stats,
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
        error: 'Failed to fetch supporters',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
