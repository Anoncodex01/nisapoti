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

// Helper functions for formatting data
function formatEarningsData(data: any[], period: string) {
  const days = period === '7 days' ? 7 : period === '30 days' ? 30 : 365;
  const result = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    const dayData = data.find(d => d.date === dateStr);
    result.push({
      day: dayName,
      value: dayData ? dayData.total : 0
    });
  }
  
  return result;
}

function formatSupportersData(data: any[], period: string) {
  const days = period === '7 days' ? 7 : period === '30 days' ? 30 : 365;
  const result = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    const dayData = data.find(d => d.date === dateStr);
    result.push({
      day: dayName,
      value: dayData ? dayData.total : 0
    });
  }
  
  return result;
}

function formatPageViewsData(data: any[], period: string) {
  const days = period === '7 days' ? 7 : period === '30 days' ? 30 : 365;
  const result = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    const dayData = data.find(d => d.date === dateStr);
    result.push({
      day: dayName,
      value: dayData ? dayData.views : 0
    });
  }
  
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (!auth.ok) {
      return addCorsHeaders(NextResponse.json({ error: auth.error }, { status: auth.status }));
    }

    // Get user ID and period from query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
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

    // Fetch user profile
    const profile = await db.queryOne(
      'SELECT id, user_id, display_name, username, bio, category, website, avatar_url FROM profiles WHERE user_id = ?',
      [userId]
    );

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Fetch earnings data based on period (from supporters table like PHP version)
    let earningsQuery = '';
    let earningsParams: any[] = [profile.user_id]; // Use profile.user_id as creator_id
    
    switch (period) {
      case '7 days':
        earningsQuery = `
          SELECT DATE(created_at) as date, COALESCE(SUM(amount), 0) as total
          FROM supporters 
          WHERE creator_id = ? AND status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `;
        break;
      case '30 days':
        earningsQuery = `
          SELECT DATE(created_at) as date, COALESCE(SUM(amount), 0) as total
          FROM supporters 
          WHERE creator_id = ? AND status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `;
        break;
      case 'All time':
        earningsQuery = `
          SELECT DATE(created_at) as date, COALESCE(SUM(amount), 0) as total
          FROM supporters 
          WHERE creator_id = ? AND status = 'completed'
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `;
        break;
    }

    const earningsData = await db.query(earningsQuery, earningsParams);
    
    // Fetch period-specific earnings totals (like PHP version)
    const earningsTotals = await db.queryOne(`
      SELECT 
        COALESCE(SUM(CASE 
          WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
          THEN amount ELSE 0 
        END), 0) as last_7_days,
        
        COALESCE(SUM(CASE 
          WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
          THEN amount ELSE 0 
        END), 0) as last_30_days,
        
        COALESCE(SUM(amount), 0) as all_time
      FROM supporters 
      WHERE creator_id = ? AND status = 'completed'
    `, [profile.user_id]);

    // Fetch supporters data based on period (like PHP version)
    let supportersQuery = '';
    let supportersParams: any[] = [profile.user_id]; // Use profile.user_id as creator_id
    
    switch (period) {
      case '7 days':
        supportersQuery = `
          SELECT DATE(created_at) as date, COUNT(DISTINCT id) as total
          FROM supporters 
          WHERE creator_id = ? AND status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `;
        break;
      case '30 days':
        supportersQuery = `
          SELECT DATE(created_at) as date, COUNT(DISTINCT id) as total
          FROM supporters 
          WHERE creator_id = ? AND status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `;
        break;
      case 'All time':
        supportersQuery = `
          SELECT DATE(created_at) as date, COUNT(DISTINCT id) as total
          FROM supporters 
          WHERE creator_id = ? AND status = 'completed'
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `;
        break;
    }

    const supportersData = await db.query(supportersQuery, supportersParams);
    
    // Fetch period-specific supporters totals (like PHP version)
    const supportersTotals = await db.queryOne(`
      SELECT 
        COUNT(DISTINCT CASE 
          WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) 
          THEN id 
        END) as last_7_days,
        COUNT(DISTINCT CASE 
          WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
          THEN id 
        END) as last_30_days,
        COUNT(DISTINCT id) as all_time
      FROM supporters 
      WHERE creator_id = ? AND status = 'completed'
    `, [profile.user_id]);

    // Mock page views data (since page_views table doesn't exist)
    const pageViewsData: any[] = [];
    const totalPageViews = { total: 0 };

    // Calculate totals from actual data
    const earningsTotal = earningsData.reduce((sum, item) => sum + item.total, 0);
    const supportersTotal = supportersData.reduce((sum, item) => sum + item.total, 0);

    // Format data for charts (using functions declared at top of file)

    const response = NextResponse.json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          username: profile.username,
          display_name: profile.display_name,
          creator_url: profile.creator_url,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          category: profile.category,
          website: profile.website
        },
        earnings: {
          total: period === '7 days' ? (earningsTotals?.last_7_days || earningsTotal) : 
                 period === '30 days' ? (earningsTotals?.last_30_days || earningsTotal) : 
                 (earningsTotals?.all_time || earningsTotal),
          period: period,
          data: formatEarningsData(earningsData, period)
        },
        supporters: {
          total: period === '7 days' ? (supportersTotals?.last_7_days || supportersTotal) : 
                 period === '30 days' ? (supportersTotals?.last_30_days || supportersTotal) :
                 (supportersTotals?.all_time || supportersTotal),
          period: period,
          data: formatSupportersData(supportersData, period)
        },
        pageViews: {
          total: totalPageViews?.total || 0,
          period: period,
          data: formatPageViewsData(pageViewsData, period)
        }
      }
    });
    
    return addCorsHeaders(response);

  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    const errorResponse = NextResponse.json(
      { 
        error: 'Failed to fetch dashboard statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addCorsHeaders(errorResponse);
  }
}
