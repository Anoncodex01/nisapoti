-- Migration script for existing wishlists
-- This script adds duration and expiration fields to existing wishlists

-- Step 1: Add new columns to wishlist table
ALTER TABLE wishlist 
ADD COLUMN IF NOT EXISTS duration_days INT DEFAULT 30,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS is_expired BOOLEAN DEFAULT FALSE,
ADD INDEX IF NOT EXISTS idx_expires_at (expires_at),
ADD INDEX IF NOT EXISTS idx_is_expired (is_expired);

-- Step 2: Update existing wishlists with duration and expiration
-- For wishlists created more than 30 days ago, give them 7 more days
UPDATE wishlist 
SET 
  duration_days = 7,
  expires_at = DATE_ADD(created_at, INTERVAL 7 DAY),
  updated_at = NOW()
WHERE 
  (duration_days IS NULL OR duration_days = 0)
  AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
  AND amount_funded < price;

-- For wishlists created 14-30 days ago, give them 14 more days
UPDATE wishlist 
SET 
  duration_days = 14,
  expires_at = DATE_ADD(created_at, INTERVAL 14 DAY),
  updated_at = NOW()
WHERE 
  (duration_days IS NULL OR duration_days = 0)
  AND created_at BETWEEN DATE_SUB(NOW(), INTERVAL 30 DAY) AND DATE_SUB(NOW(), INTERVAL 14 DAY)
  AND amount_funded < price;

-- For wishlists created less than 14 days ago, give them 30 days total
UPDATE wishlist 
SET 
  duration_days = 30,
  expires_at = DATE_ADD(created_at, INTERVAL 30 DAY),
  updated_at = NOW()
WHERE 
  (duration_days IS NULL OR duration_days = 0)
  AND created_at > DATE_SUB(NOW(), INTERVAL 14 DAY)
  AND amount_funded < price;

-- Step 3: Mark wishlists as expired if they have passed their expiration date
UPDATE wishlist 
SET 
  is_expired = TRUE,
  updated_at = NOW()
WHERE 
  expires_at <= NOW() 
  AND is_expired = FALSE
  AND amount_funded < price;

-- Step 4: Show migration summary
SELECT 
  'Migration Summary' as status,
  COUNT(*) as total_wishlists,
  SUM(CASE WHEN duration_days IS NOT NULL AND duration_days > 0 THEN 1 ELSE 0 END) as migrated_wishlists,
  SUM(CASE WHEN is_expired = TRUE THEN 1 ELSE 0 END) as expired_wishlists,
  SUM(CASE WHEN amount_funded >= price THEN 1 ELSE 0 END) as fully_funded_wishlists
FROM wishlist;
