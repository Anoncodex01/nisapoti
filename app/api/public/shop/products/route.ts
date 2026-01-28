import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

// GET - Fetch products for a creator (public, no authentication required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorUsername = searchParams.get('creator_username');
    const status = searchParams.get('status') || 'active'; // Only show active products by default
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!creatorUsername) {
      return NextResponse.json({ 
        success: false, 
        error: 'creator_username parameter is required' 
      }, { status: 400 });
    }

    let query = `
      SELECT 
        p.*,
        COUNT(o.id) as total_sales,
        COALESCE(SUM(o.total_amount), 0) as total_revenue
      FROM products p
      LEFT JOIN orders o ON p.id = o.product_id AND o.payment_status = 'paid'
      LEFT JOIN profiles pr ON p.creator_id = pr.user_id
      WHERE pr.username = ?
    `;
    
    const params: any[] = [creatorUsername];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }

    query += `
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const products = await db.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM products p
      LEFT JOIN profiles pr ON p.creator_id = pr.user_id
      WHERE pr.username = ?
    `;
    const countParams: any[] = [creatorUsername];
    
    if (status) {
      countQuery += ' AND p.status = ?';
      countParams.push(status);
    }
    
    if (category) {
      countQuery += ' AND p.category = ?';
      countParams.push(category);
    }

    const [{ total }] = await db.query(countQuery, countParams);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching public products:', error);
    console.error('Error details:', message);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch products',
      details: message 
    }, { status: 500 });
  }
}
