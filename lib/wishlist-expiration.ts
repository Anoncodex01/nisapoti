import { db } from './database';

export interface WishlistExpirationResult {
  expiredWishlists: number;
  releasedAmount: number;
  affectedCreators: string[];
}

/**
 * Check and release funds from expired wishlists
 * This function should be called periodically (e.g., via cron job)
 */
export async function processExpiredWishlists(): Promise<WishlistExpirationResult> {
  try {
    const now = new Date();
    
    // Find wishlists that have expired but haven't been marked as expired yet
    const expiredWishlists = await db.query(`
      SELECT 
        w.id,
        w.creator_id,
        w.title,
        w.amount_funded,
        w.price,
        w.expires_at,
        w.is_expired
      FROM wishlist w
      WHERE w.expires_at <= ? 
        AND w.is_expired = FALSE
        AND w.amount_funded < w.price
    `, [now]);

    if (expiredWishlists.length === 0) {
      return {
        expiredWishlists: 0,
        releasedAmount: 0,
        affectedCreators: []
      };
    }

    let totalReleasedAmount = 0;
    const affectedCreators = new Set<string>();

    // Process each expired wishlist
    for (const wishlist of expiredWishlists) {
      // Mark wishlist as expired
      await db.execute(`
        UPDATE wishlist 
        SET is_expired = TRUE, updated_at = NOW()
        WHERE id = ?
      `, [wishlist.id]);

      // Calculate the amount to release (the funded amount)
      const releasedAmount = parseFloat(wishlist.amount_funded);
      totalReleasedAmount += releasedAmount;
      affectedCreators.add(wishlist.creator_id);

      console.log(`Released TZS ${releasedAmount} from expired wishlist "${wishlist.title}" (ID: ${wishlist.id})`);
    }

    return {
      expiredWishlists: expiredWishlists.length,
      releasedAmount: totalReleasedAmount,
      affectedCreators: Array.from(affectedCreators)
    };

  } catch (error) {
    console.error('Error processing expired wishlists:', error);
    throw error;
  }
}

/**
 * Update wishlist expiration status for a specific wishlist
 */
export async function updateWishlistExpiration(wishlistId: number): Promise<void> {
  try {
    const now = new Date();
    
    // Check if wishlist has expired
    const wishlist = await db.queryOne(`
      SELECT id, expires_at, is_expired, amount_funded, price
      FROM wishlist 
      WHERE id = ?
    `, [wishlistId]);

    if (!wishlist) {
      throw new Error('Wishlist not found');
    }

    // If wishlist has expired and not yet marked as expired
    if (wishlist.expires_at && new Date(wishlist.expires_at as string) <= now && !wishlist.is_expired) {
      await db.execute(`
        UPDATE wishlist 
        SET is_expired = TRUE, updated_at = NOW()
        WHERE id = ?
      `, [wishlistId]);

      console.log(`Marked wishlist ${wishlistId} as expired`);
    }

  } catch (error) {
    console.error('Error updating wishlist expiration:', error);
    throw error;
  }
}

/**
 * Set expiration date for a wishlist when it's created
 */
export async function setWishlistExpiration(wishlistId: number, durationDays: number = 30): Promise<void> {
  try {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + durationDays);

    await db.execute(`
      UPDATE wishlist 
      SET duration_days = ?, expires_at = ?, updated_at = NOW()
      WHERE id = ?
    `, [durationDays, expirationDate, wishlistId]);

    console.log(`Set wishlist ${wishlistId} to expire on ${expirationDate.toISOString()}`);

  } catch (error) {
    console.error('Error setting wishlist expiration:', error);
    throw error;
  }
}

/**
 * Get wishlists that are about to expire (within next 7 days)
 */
export async function getExpiringWishlists(creatorId?: string): Promise<any[]> {
  try {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    let query = `
      SELECT 
        w.id,
        w.title,
        w.price,
        w.amount_funded,
        w.expires_at,
        w.is_expired,
        u.display_name as creator_name,
        u.username as creator_username
      FROM wishlist w
      JOIN users u ON w.creator_id = u.id
      WHERE w.expires_at <= ? 
        AND w.is_expired = FALSE
        AND w.amount_funded < w.price
    `;
    
    const params = [sevenDaysFromNow];
    
    if (creatorId) {
      query += ' AND w.creator_id = ?';
      params.push(creatorId);
    }
    
    query += ' ORDER BY w.expires_at ASC';

    return await db.query(query, params);

  } catch (error) {
    console.error('Error getting expiring wishlists:', error);
    throw error;
  }
}
