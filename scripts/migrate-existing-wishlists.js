#!/usr/bin/env node

/**
 * Migration script for existing wishlists
 * This script adds duration and expiration fields to existing wishlists
 * 
 * Usage: node scripts/migrate-existing-wishlists.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function migrateExistingWishlists() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'nisapoti_nis'
    });

    console.log(`[${new Date().toISOString()}] Starting wishlist migration...`);

    // First, add the new columns if they don't exist
    console.log('Adding new columns to wishlist table...');
    
    await connection.execute(`
      ALTER TABLE wishlist 
      ADD COLUMN IF NOT EXISTS duration_days INT DEFAULT 30,
      ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NULL,
      ADD COLUMN IF NOT EXISTS is_expired BOOLEAN DEFAULT FALSE
    `);

    console.log('✅ New columns added successfully');

    // Get all existing wishlists that don't have duration set
    const [wishlists] = await connection.execute(`
      SELECT id, name, created_at, amount_funded, price
      FROM wishlist 
      WHERE duration_days IS NULL OR duration_days = 0
      ORDER BY created_at ASC
    `);

    console.log(`Found ${wishlists.length} existing wishlists to migrate`);

    if (wishlists.length === 0) {
      console.log('No wishlists need migration');
      return;
    }

    let migrated = 0;
    let skipped = 0;

    for (const wishlist of wishlists) {
      try {
        // Determine duration based on wishlist age and funding status
        const createdAt = new Date(wishlist.created_at);
        const now = new Date();
        const daysSinceCreation = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
        
        let durationDays = 30; // Default duration
        let expiresAt = new Date(createdAt);
        
        // If wishlist is already fully funded, set it as completed (no expiration needed)
        if (parseFloat(wishlist.amount_funded) >= parseFloat(wishlist.price)) {
          console.log(`✅ Wishlist "${wishlist.name}" (ID: ${wishlist.id}) is already fully funded - skipping`);
          skipped++;
          continue;
        }
        
        // If wishlist is older than 30 days, give it 7 more days to complete
        if (daysSinceCreation > 30) {
          durationDays = 7;
          expiresAt.setDate(expiresAt.getDate() + 7);
        } else if (daysSinceCreation > 14) {
          // If wishlist is 14-30 days old, give it 14 more days
          durationDays = 14;
          expiresAt.setDate(expiresAt.getDate() + 14);
        } else {
          // If wishlist is less than 14 days old, give it 30 days total
          durationDays = 30;
          expiresAt.setDate(expiresAt.getDate() + 30);
        }

        // Update the wishlist with duration and expiration
        await connection.execute(`
          UPDATE wishlist 
          SET duration_days = ?, expires_at = ?, updated_at = NOW()
          WHERE id = ?
        `, [durationDays, expiresAt, wishlist.id]);

        console.log(`✅ Migrated wishlist "${wishlist.name}" (ID: ${wishlist.id}) - Duration: ${durationDays} days, Expires: ${expiresAt.toISOString()}`);
        migrated++;

      } catch (error) {
        console.error(`❌ Error migrating wishlist ${wishlist.id}:`, error.message);
      }
    }

    // Check for any wishlists that should be marked as expired
    console.log('\nChecking for wishlists that should be marked as expired...');
    
    const [expiredWishlists] = await connection.execute(`
      SELECT id, name, expires_at, amount_funded, price
      FROM wishlist 
      WHERE expires_at <= NOW() 
        AND is_expired = FALSE
        AND amount_funded < price
    `);

    if (expiredWishlists.length > 0) {
      console.log(`Found ${expiredWishlists.length} wishlists that should be marked as expired`);
      
      for (const wishlist of expiredWishlists) {
        await connection.execute(`
          UPDATE wishlist 
          SET is_expired = TRUE, updated_at = NOW()
          WHERE id = ?
        `, [wishlist.id]);
        
        console.log(`✅ Marked wishlist "${wishlist.name}" (ID: ${wishlist.id}) as expired`);
      }
    }

    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Migrated: ${migrated} wishlists`);
    console.log(`   - Skipped: ${skipped} wishlists (already fully funded)`);
    console.log(`   - Expired: ${expiredWishlists.length} wishlists`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
migrateExistingWishlists();
