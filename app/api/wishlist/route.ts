import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

// GET /api/wishlist - Fetch user's wishlist items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch wishlist items with images
    const wishlistQuery = `
      SELECT 
        w.id,
        w.uuid,
        w.user_id,
        w.name,
        w.category,
        w.price,
        w.description,
        w.image_url,
        w.link,
        w.is_priority,
        w.amount_funded,
        w.created_at,
        w.updated_at,
        w.hashtags,
        COUNT(DISTINCT s.id) as supporters_count
      FROM wishlist w
      LEFT JOIN supporters s ON w.user_id = s.creator_id AND s.status = 'completed'
      WHERE w.user_id = ?
      GROUP BY w.id
      ORDER BY w.is_priority DESC, w.created_at DESC
    `;

    const wishlistItems = await db.query(wishlistQuery, [user_id]);

    // Convert image paths to public paths for Next.js
    const convertImagePath = (imageUrl: string) => {
      if (imageUrl.startsWith('/creator/assets/')) {
        return imageUrl.replace('/creator/assets/', '/uploads/');
      }
      return imageUrl;
    };

    // Fetch images for each wishlist item
    const itemsWithImages = await Promise.all(
      wishlistItems.map(async (item: any) => {
        const imagesQuery = `
          SELECT image_url 
          FROM wishlist_images 
          WHERE wishlist_id = ?
          ORDER BY created_at ASC
        `;
        
        const images = await db.query(imagesQuery, [item.id]);
        
        return {
          id: item.uuid,
          uuid: item.uuid,
          name: item.name,
          category: item.category,
          price: item.price,
          description: item.description,
          link: item.link,
          is_priority: Boolean(item.is_priority),
          hashtags: item.hashtags || '',
          amount_funded: item.amount_funded,
          created_at: item.created_at,
          images: images.length > 0 
            ? images.map((img: any) => convertImagePath(img.image_url)) 
            : (item.image_url ? [convertImagePath(item.image_url)] : []),
          supporters_count: item.supporters_count
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: itemsWithImages
    });

  } catch (error) {
    console.error('Error fetching wishlist items:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wishlist items' },
      { status: 500 }
    );
  }
}

// POST /api/wishlist - Add new wishlist item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      name,
      category,
      price,
      description,
      link,
      is_priority,
      hashtags,
      images,
      duration_days = 30
    } = body;

    // Validate required fields
    if (!user_id || !name || !category || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate UUID for the wishlist item
    const wishlistUuid = uuidv4();

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration_days);

    // Insert wishlist item
    const insertQuery = `
      INSERT INTO wishlist (
        uuid, user_id, name, category, price, description, 
        link, is_priority, hashtags, amount_funded, duration_days, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `;

    const result = await db.execute(insertQuery, [
      wishlistUuid,
      user_id,
      name,
      category,
      parseInt(price),
      description || '',
      link || '',
      is_priority ? 1 : 0,
      hashtags || '',
      duration_days,
      expiresAt
    ]);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create wishlist item' },
        { status: 500 }
      );
    }

    const wishlistId = (result.data as any).insertId;
    console.log('🔍 Wishlist creation result:', result);
    console.log('🔍 Extracted wishlist ID:', wishlistId);

    // Insert images if provided
    console.log('🔍 Wishlist creation - images received:', images);
    if (images && images.length > 0 && wishlistId) {
      console.log('🔍 Inserting images for wishlist ID:', wishlistId);
      for (const imageUrl of images) {
        console.log('🔍 Inserting image:', imageUrl);
        const imageResult = await db.execute(
          'INSERT INTO wishlist_images (wishlist_id, image_url) VALUES (?, ?)',
          [wishlistId, imageUrl]
        );
        
        if (!imageResult.success) {
          console.error('❌ Failed to insert image:', imageResult.error);
        } else {
          console.log('✅ Image inserted successfully');
        }
      }
      console.log('✅ All images processed');
    } else if (images && images.length > 0 && !wishlistId) {
      console.log('❌ Cannot insert images - invalid wishlist ID');
    } else {
      console.log('❌ No images provided for wishlist item');
    }

    return NextResponse.json({
      success: true,
      data: {
        id: wishlistUuid,
        wishlist_id: wishlistId
      }
    });

  } catch (error) {
    console.error('Error adding wishlist item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add wishlist item' },
      { status: 500 }
    );
  }
}
