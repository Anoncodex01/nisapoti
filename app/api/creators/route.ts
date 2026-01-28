import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const random = searchParams.get('random') === 'true';
    const seedParam = searchParams.get('seed');
    
    console.log('🔍 Fetching creators with params:', { category, search, limit, offset });

    // Build the base query
    let query = `
      SELECT 
        p.id,
        p.user_id,
        p.display_name,
        p.username,
        p.bio,
        p.category,
        p.website,
        p.avatar_url,
        p.created_at,
        p.updated_at,
        COUNT(DISTINCT s.id) as supporter_count
      FROM profiles p
      LEFT JOIN supporters s ON p.user_id = s.creator_id AND s.status = 'completed'
      WHERE p.status = 'active' AND p.avatar_url IS NOT NULL AND p.avatar_url != ''
    `;

    const queryParams: any[] = [];

    // Add category filter
    if (category && category !== '') {
      query += " AND REPLACE(LOWER(p.category), ' ', '_') = ?";
      queryParams.push(String(category).toLowerCase().replace(/\s+/g, '_'));
    }

    // Add search filter
    if (search && search.trim() !== '') {
      query += ' AND (p.display_name LIKE ? OR p.username LIKE ? OR p.bio LIKE ?)';
      const searchTerm = `%${search.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Add grouping and ordering
    query += `
      GROUP BY p.id
      ORDER BY `;

    if (random) {
      const seed = seedParam && !Number.isNaN(Number(seedParam)) ? Number(seedParam) : null;
      if (seed !== null) {
        query += 'RAND(?)';
        queryParams.push(seed);
      } else {
        query += 'RAND()';
      }
    } else {
      query += 'supporter_count DESC, p.created_at DESC';
    }

    query += `\n      LIMIT ? OFFSET ?\n    `;

    // Convert to numbers to ensure proper types
    queryParams.push(Number(limit), Number(offset));

    console.log('📊 Executing query:', query);
    console.log('📊 Query params:', queryParams);

    // Execute the query
    const creators = await db.query(query, queryParams);

    // Get unique categories for filter
    const categoriesQuery = `
      SELECT DISTINCT category 
      FROM profiles 
      WHERE status = 'active' AND category IS NOT NULL AND category != ''
      ORDER BY category
    `;
    const categoriesResult = await db.query(categoriesQuery);
    const categories = categoriesResult.map((row: any) => row.category);

    console.log('✅ Found creators:', creators.length);
    console.log('✅ Available categories:', categories);

    return NextResponse.json({
      success: true,
      creators: creators,
      categories: categories,
      hasMore: creators.length === limit
    });

  } catch (error) {
    console.error('❌ Creators API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch creators',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}