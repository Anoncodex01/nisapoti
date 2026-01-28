import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = searchParams.get('limit') || '6';
    const random = searchParams.get('random') === 'true';
    const seedParam = searchParams.get('seed');

    // Get current date to create a seed for daily rotation
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Create a simple hash from the date for consistent daily rotation
    const dateHash = dateString.split('-').join('');
    const seed = parseInt(dateHash) % 1000;

    // Build category filter (normalize spaces/slug)
    const categoryFilter = category && category !== 'all'
      ? `AND REPLACE(LOWER(p.category), ' ', '_') = '${String(category).toLowerCase().replace(/\s+/g, '_')}'`
      : '';

    // If random=true, use SQL-level random ordering (deterministic with seed if provided)
    if (random) {
      let creatorsQuery = `
        SELECT 
          p.user_id,
          p.username,
          p.display_name,
          p.avatar_url,
          p.category,
          p.bio,
          COUNT(DISTINCT s.id) as supporter_count,
          COALESCE(SUM(CASE WHEN s.status = 'completed' THEN s.amount ELSE 0 END), 0) as total_earnings
        FROM profiles p
        LEFT JOIN supporters s ON p.user_id = s.creator_id AND s.status = 'completed'
        WHERE p.status = 'active'
          ${categoryFilter}
        GROUP BY p.id
        ORDER BY `;

      const seed = seedParam && !Number.isNaN(Number(seedParam)) ? Number(seedParam) : null;
      if (seed !== null) {
        creatorsQuery += `RAND(${seed})`;
      } else {
        creatorsQuery += 'RAND()';
      }
      creatorsQuery += `\n        LIMIT ${parseInt(limit)}\n      `;

      const creators = await db.query(creatorsQuery);

      const processedCreators = creators.map((creator: any) => ({
        user_id: creator.user_id,
        username: creator.username,
        display_name: creator.display_name,
        avatar_url: creator.avatar_url?.startsWith('/creator/assets/')
          ? creator.avatar_url.replace('/creator/assets/', '/uploads/')
          : creator.avatar_url,
        category: creator.category,
        bio: creator.bio,
        supporter_count: parseInt(creator.supporter_count || '0'),
        total_earnings: parseFloat(creator.total_earnings || '0')
      }));

      return NextResponse.json({ success: true, data: processedCreators });
    }

    // Otherwise: Fetch featured creators with daily rotation (existing behavior)
    const creatorsQuery = `
      SELECT 
        p.user_id,
        p.username,
        p.display_name,
        p.avatar_url,
        p.category,
        p.bio,
        COUNT(DISTINCT s.id) as supporter_count,
        COALESCE(SUM(CASE WHEN s.status = 'completed' THEN s.amount ELSE 0 END), 0) as total_earnings
      FROM profiles p
      LEFT JOIN supporters s ON p.user_id = s.creator_id AND s.status = 'completed'
      WHERE p.status = 'active'
        ${categoryFilter}
      GROUP BY p.id
      ORDER BY supporter_count DESC, p.created_at DESC
      LIMIT ${parseInt(limit)}
    `;

    const creators = await db.query(creatorsQuery);

    // Convert image paths to public paths for Next.js
    const convertImagePath = (imageUrl: string) => {
      if (imageUrl && imageUrl.startsWith('/creator/assets/')) {
        return imageUrl.replace('/creator/assets/', '/uploads/');
      }
      return imageUrl;
    };

    // Process creators data
    const processedCreators = creators.map((creator: any) => ({
      user_id: creator.user_id,
      username: creator.username,
      display_name: creator.display_name,
      avatar_url: convertImagePath(creator.avatar_url),
      category: creator.category,
      bio: creator.bio,
      supporter_count: parseInt(creator.supporter_count || '0'),
      total_earnings: parseFloat(creator.total_earnings || '0')
    }));

    // Rotate creators daily by using the seed
    const rotatedCreators = processedCreators.slice(seed % processedCreators.length)
      .concat(processedCreators.slice(0, seed % processedCreators.length))
      .slice(0, 4); // Show top 4

    return NextResponse.json({
      success: true,
      data: rotatedCreators
    });

  } catch (error) {
    console.error('Error fetching featured creators:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch featured creators',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
