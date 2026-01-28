import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const categoriesQuery = `
      SELECT id, name, slug, icon 
      FROM categories 
      WHERE slug != 'all'
      ORDER BY name ASC
    `;

    const categories = await db.query(categoriesQuery);

    return NextResponse.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
