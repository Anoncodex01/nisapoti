import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Get creator profile from database
    const creatorQuery = `
      SELECT 
        p.user_id, p.username, p.display_name, p.avatar_url, p.category, p.bio, p.creator_url, p.website,
        COUNT(DISTINCT s.id) as supporter_count
      FROM profiles p
      LEFT JOIN supporters s ON p.user_id = s.creator_id AND s.status = 'completed'
      WHERE (p.username = ? OR LOWER(p.username) = LOWER(?) OR p.creator_url = ? OR LOWER(p.creator_url) = LOWER(?))
        AND p.status = 'active'
      GROUP BY p.id
    `;

    const creatorResult = await db.queryOne(creatorQuery, [username, username, username, username]);

    if (!creatorResult) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Get wishlist items for the creator
    const wishlistQuery = `
      SELECT 
        w.id, w.uuid, w.name, w.price, w.amount_funded, w.is_priority, w.description,
        wi.image_url
      FROM wishlist w
      LEFT JOIN wishlist_images wi ON w.id = wi.wishlist_id
      WHERE w.user_id = ?
      ORDER BY w.is_priority DESC, w.created_at DESC
      LIMIT 8
    `;

    const wishlistItems = await db.query(wishlistQuery, [creatorResult.user_id]);

    // Convert image paths to public paths for Next.js
    const convertImagePath = (imageUrl: string) => {
      if (imageUrl.startsWith('/creator/assets/')) {
        return imageUrl.replace('/creator/assets/', '/uploads/');
      }
      return imageUrl;
    };

    // Group images by wishlist item
    const wishlistWithImages = wishlistItems.reduce((acc: any, item: any) => {
      const existingItem = acc.find((i: any) => i.id === item.id);
      if (existingItem) {
        if (item.image_url) {
          existingItem.images = existingItem.images || [];
          existingItem.images.push(convertImagePath(item.image_url));
        }
      } else {
        acc.push({
          id: item.id,
          uuid: item.uuid,
          name: item.name,
          price: parseFloat(item.price),
          amount_funded: parseFloat(item.amount_funded || 0),
          is_priority: item.is_priority,
          description: item.description,
          images: item.image_url ? [convertImagePath(item.image_url)] : []
        });
      }
      return acc;
    }, []);

    const creatorData = {
      user_id: creatorResult.user_id,
      username: creatorResult.username,
      display_name: creatorResult.display_name,
      avatar_url: creatorResult.avatar_url ? convertImagePath(creatorResult.avatar_url) : creatorResult.avatar_url,
      category: creatorResult.category,
      bio: creatorResult.bio,
      creator_url: creatorResult.creator_url,
      website: creatorResult.website,
      supporter_count: parseInt(creatorResult.supporter_count || '0'),
      wishlist_items: wishlistWithImages
    };

    return NextResponse.json({
      success: true,
      data: creatorData
    });

  } catch (error) {
    console.error('❌ Creator API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch creator profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
