import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { requireAuth } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

// Add CORS headers for mobile apps
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.ok) {
      return addCorsHeaders(NextResponse.json({ error: auth.error }, { status: auth.status }));
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const period = searchParams.get('period') || '7 days';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    if (userId !== auth.userId) {
      return addCorsHeaders(NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
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
        dateFilter = "AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        break;
      case '30 days':
        dateFilter = "AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        break;
      case 'All time':
        dateFilter = '';
        break;
    }

    // Fetch recent supporters (exclude wishlist supports - they're handled separately)
    const supportersQuery = `
      SELECT 
        'supporter' as type,
        id,
        name,
        amount,
        created_at,
        NULL as product_title,
        NULL as product_id,
        NULL as order_id,
        NULL as wishlist_name,
        NULL as wishlist_id
      FROM supporters 
      WHERE creator_id = ? AND status = 'completed' AND (type != 'wishlist' OR type IS NULL) ${dateFilter}
      ORDER BY created_at DESC
      LIMIT ?
    `;

    // Fetch recent shop orders (increased limit to get more historical data)
    const ordersQuery = `
      SELECT 
        'order' as type,
        NULL as id,
        NULL as name,
        total_amount as amount,
        order_date as created_at,
        p.title as product_title,
        o.product_id,
        o.id as order_id,
        NULL as wishlist_name,
        NULL as wishlist_id
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.creator_id = ? AND o.payment_status = 'paid' ${dateFilter.replace('created_at', 'o.order_date')}
      ORDER BY o.order_date DESC
      LIMIT ?
    `;

    // Fetch recent wishlist contributions (increased limit to get more historical data)
    const wishlistQuery = `
      SELECT 
        'wishlist' as type,
        s.id,
        s.name,
        s.amount,
        s.created_at,
        NULL as product_title,
        NULL as product_id,
        NULL as order_id,
        w.name as wishlist_name,
        w.id as wishlist_id
      FROM supporters s
      LEFT JOIN wishlist w ON s.wishlist_id = w.id
      WHERE s.creator_id = ? AND s.status = 'completed' AND s.type = 'wishlist' ${dateFilter}
      ORDER BY s.created_at DESC
      LIMIT ?
    `;

    // Execute all queries in parallel
    const [supporters, orders, wishlist] = await Promise.all([
      db.query(supportersQuery, [creatorId, limit]),
      db.query(ordersQuery, [creatorId, limit]),
      db.query(wishlistQuery, [creatorId, limit])
    ]);

    // Combine all activities and sort by date
    const allActivities = [
      ...supporters.map(s => ({ ...s, type: 'supporter' })),
      ...orders.map(o => ({ ...o, type: 'order' })),
      ...wishlist.map(w => ({ ...w, type: 'wishlist' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Take only the most recent activities
    const recentActivities = allActivities.slice(0, limit);

    const response = NextResponse.json({
      success: true,
      activities: recentActivities,
      total: allActivities.length,
      period,
    });
    
    return addCorsHeaders(response);

  } catch (error) {
    console.error('Error fetching recent activity:', error);
    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to fetch recent activity',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse);
  }
}
