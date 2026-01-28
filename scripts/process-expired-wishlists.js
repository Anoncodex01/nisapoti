#!/usr/bin/env node

/**
 * Cron job script to process expired wishlists
 * This script should be run periodically (e.g., every hour) to release funds from expired wishlists
 * 
 * Usage:
 * - Add to crontab: 0 * * * * /usr/bin/node /path/to/scripts/process-expired-wishlists.js
 * - Or run manually: node scripts/process-expired-wishlists.js
 */

const { processExpiredWishlists } = require('../lib/wishlist-expiration');

async function main() {
  try {
    console.log(`[${new Date().toISOString()}] Starting expired wishlists processing...`);
    
    const result = await processExpiredWishlists();
    
    if (result.expiredWishlists > 0) {
      console.log(`[${new Date().toISOString()}] Processed ${result.expiredWishlists} expired wishlists`);
      console.log(`[${new Date().toISOString()}] Released TZS ${result.releasedAmount.toLocaleString()} in total`);
      console.log(`[${new Date().toISOString()}] Affected creators: ${result.affectedCreators.join(', ')}`);
    } else {
      console.log(`[${new Date().toISOString()}] No expired wishlists found`);
    }
    
    console.log(`[${new Date().toISOString()}] Expired wishlists processing completed successfully`);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error processing expired wishlists:`, error);
    process.exit(1);
  }
}

// Run the script
main();
