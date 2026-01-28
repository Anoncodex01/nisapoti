import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

// GET - Fetch all product categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = 'SELECT * FROM product_categories';
    const params: any[] = [];

    if (activeOnly) {
      query += ' WHERE is_active = ?';
      params.push(true);
    }

    query += ' ORDER BY name ASC';

    const categories = await db.query(query, params);

    return NextResponse.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
