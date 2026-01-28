import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

// GET /api/wishlist/[id] - Get specific wishlist item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch wishlist item by UUID
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
      WHERE w.uuid = ?
      GROUP BY w.id
    `;

    const wishlistItems = await db.query(wishlistQuery, [id]);

    if (wishlistItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Wishlist item not found' },
        { status: 404 }
      );
    }

    const item = wishlistItems[0];

    // Fetch images for the wishlist item
    const imagesQuery = `
      SELECT image_url 
      FROM wishlist_images 
      WHERE wishlist_id = ?
      ORDER BY created_at ASC
    `;
    
    const images = await db.query(imagesQuery, [item.id]);

    // Fetch creator information
    const creatorQuery = `
      SELECT 
        p.id, p.user_id, p.username, p.display_name, p.bio, p.avatar_url, p.category
      FROM profiles p
      WHERE p.user_id = ?
    `;
    
    const creatorResult = await db.query(creatorQuery, [item.user_id]);
    
    if (!creatorResult || creatorResult.length === 0) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    const creator = creatorResult[0];

    // Fetch supporters for this wishlist (completed only)
    const supportersQuery = `
      SELECT name, amount, created_at
      FROM supporters
      WHERE wishlist_id = ? AND type = 'wishlist' AND status = 'completed'
      ORDER BY created_at DESC
      LIMIT 20
    `;
    
    const supportersResult = await db.query(supportersQuery, [item.id]);

    // Get supporter count (all completed transactions)
    const supporterCountQuery = `
      SELECT COUNT(*) as count
      FROM supporters
      WHERE wishlist_id = ? AND type = 'wishlist' AND status = 'completed'
    `;
    
    const supporterCountResult = await db.query(supporterCountQuery, [item.id]);
    const supporterCount = supporterCountResult[0]?.count || 0;

    // Convert image paths to public paths for Next.js
    const convertImagePath = (imageUrl: string) => {
      if (imageUrl.startsWith('/creator/assets/')) {
        return imageUrl.replace('/creator/assets/', '/uploads/');
      }
      return imageUrl;
    };

    const itemWithImages = {
      id: item.id,
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

    // Convert creator avatar path if needed
    const creatorWithFixedAvatar = {
      ...creator,
      avatar_url: creator.avatar_url ? convertImagePath(creator.avatar_url) : creator.avatar_url
    };

    return NextResponse.json({
      success: true,
      data: {
        wishlist: itemWithImages,
        creator: creatorWithFixedAvatar,
        supporters: supportersResult,
        supporter_count: supporterCount
      }
    });

  } catch (error) {
    console.error('Error fetching wishlist item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wishlist item' },
      { status: 500 }
    );
  }
}

// PUT /api/wishlist/[id] - Update wishlist item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      name,
      category,
      price,
      description,
      link,
      is_priority,
      hashtags,
      images
    } = body;

    // Validate required fields
    if (!name || !category || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update wishlist item
    const updateQuery = `
      UPDATE wishlist 
      SET name = ?, category = ?, price = ?, description = ?, 
          link = ?, is_priority = ?, hashtags = ?, updated_at = CURRENT_TIMESTAMP
      WHERE uuid = ?
    `;

    const result = await db.execute(updateQuery, [
      name,
      category,
      parseInt(price),
      description || '',
      link || '',
      is_priority ? 1 : 0,
      hashtags || '',
      id
    ]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Wishlist item not found' },
        { status: 404 }
      );
    }

    // Get the wishlist ID for image updates
    const getWishlistIdQuery = 'SELECT id FROM wishlist WHERE uuid = ?';
    const wishlistResult = await db.query(getWishlistIdQuery, [id]);
    
    if (wishlistResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Wishlist item not found' },
        { status: 404 }
      );
    }

    const wishlistId = wishlistResult[0].id;

    // Update images if provided
    if (images !== undefined) {
      // Delete existing images
      await db.execute('DELETE FROM wishlist_images WHERE wishlist_id = ?', [wishlistId]);
      
      // Insert new images
      if (images.length > 0) {
        for (const imageUrl of images) {
          await db.execute(
            'INSERT INTO wishlist_images (wishlist_id, image_url) VALUES (?, ?)',
            [wishlistId, imageUrl]
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Wishlist item updated successfully'
    });

  } catch (error) {
    console.error('Error updating wishlist item:', error);
    return NextResponse.json(
      { success: false, error: `Failed to update wishlist item: ${error}` },
      { status: 500 }
    );
  }
}

// DELETE /api/wishlist/[id] - Delete wishlist item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get the wishlist ID first
    const getWishlistIdQuery = 'SELECT id FROM wishlist WHERE uuid = ?';
    const wishlistResult = await db.query(getWishlistIdQuery, [id]);
    
    if (wishlistResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Wishlist item not found' },
        { status: 404 }
      );
    }

    const wishlistId = wishlistResult[0].id;

    // Delete images first (due to foreign key constraint)
    await db.execute('DELETE FROM wishlist_images WHERE wishlist_id = ?', [wishlistId]);

    // Delete wishlist item
    const deleteQuery = 'DELETE FROM wishlist WHERE uuid = ?';
    const result = await db.execute(deleteQuery, [id]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Wishlist item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Wishlist item deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting wishlist item:', error);
    return NextResponse.json(
      { success: false, error: `Failed to delete wishlist item: ${error}` },
      { status: 500 }
    );
  }
}
