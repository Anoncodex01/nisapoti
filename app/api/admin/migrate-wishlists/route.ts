import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin (you can add proper admin authentication here)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('Starting wishlist migration...');

    // Step 1: Add new columns if they don't exist
    await db.execute(`
      ALTER TABLE wishlist 
      ADD COLUMN IF NOT EXISTS duration_days INT DEFAULT 30,
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS is_expired BOOLEAN DEFAULT FALSE
    `);

    // Step 2: Get existing wishlists that need migration
    const existingWishlists = await db.query(`
      SELECT id, name, created_at, amount_funded, price
      FROM wishlist 
      WHERE duration_days IS NULL OR duration_days = 0
      ORDER BY created_at ASC
    `);

    console.log(`Found ${existingWishlists.length} existing wishlists to migrate`);

    let migrated = 0;
    let skipped = 0;
    let expired = 0;

    // Step 3: Migrate each wishlist
    for (const wishlist of existingWishlists) {
      try {
        // Skip if already fully funded
        if (parseFloat(wishlist.amount_funded) >= parseFloat(wishlist.price)) {
          console.log(`Skipping fully funded wishlist: ${wishlist.name}`);
          skipped++;
          continue;
        }

        const createdAt = new Date(wishlist.created_at);
        const now = new Date();
        const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
        
        let durationDays = 30;
        let expiresAt = new Date(createdAt);
        
        // Determine duration based on age
        if (daysSinceCreation > 30) {
          durationDays = 7;
          expiresAt.setDate(expiresAt.getDate() + 7);
        } else if (daysSinceCreation > 14) {
          durationDays = 14;
          expiresAt.setDate(expiresAt.getDate() + 14);
        } else {
          durationDays = 30;
          expiresAt.setDate(expiresAt.getDate() + 30);
        }

        // Update wishlist
        await db.execute(`
          UPDATE wishlist 
          SET duration_days = ?, expires_at = ?, updated_at = NOW()
          WHERE id = ?
        `, [durationDays, expiresAt, wishlist.id]);

        console.log(`Migrated wishlist: ${wishlist.name} (${durationDays} days)`);
        migrated++;

      } catch (error) {
        console.error(`Error migrating wishlist ${wishlist.id}:`, error);
      }
    }

    // Step 4: Mark expired wishlists
    const expiredWishlists = await db.query(`
      SELECT id, name FROM wishlist 
      WHERE expires_at <= NOW() 
        AND is_expired = FALSE
        AND amount_funded < price
    `);

    for (const wishlist of expiredWishlists) {
      await db.execute(`
        UPDATE wishlist 
        SET is_expired = TRUE, updated_at = NOW()
        WHERE id = ?
      `, [wishlist.id]);
      
      console.log(`Marked as expired: ${wishlist.name}`);
      expired++;
    }

    return NextResponse.json({
      success: true,
      message: 'Wishlist migration completed successfully',
      data: {
        totalWishlists: existingWishlists.length,
        migrated,
        skipped,
        expired,
        migratedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get migration status
    const stats = await db.queryOne(`
      SELECT 
        COUNT(*) as total_wishlists,
        SUM(CASE WHEN duration_days IS NOT NULL AND duration_days > 0 THEN 1 ELSE 0 END) as migrated_wishlists,
        SUM(CASE WHEN is_expired = TRUE THEN 1 ELSE 0 END) as expired_wishlists,
        SUM(CASE WHEN amount_funded >= price THEN 1 ELSE 0 END) as fully_funded_wishlists,
        SUM(CASE WHEN duration_days IS NULL OR duration_days = 0 THEN 1 ELSE 0 END) as needs_migration
      FROM wishlist
    `);

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        checkedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error checking migration status:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check migration status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
