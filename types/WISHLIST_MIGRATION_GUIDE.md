# Wishlist Migration Guide

## Overview
This guide explains how to migrate existing wishlists to support the new duration and expiration features.

## What This Migration Does

### For Existing Creators with Wishlists:
1. **Adds Duration Fields**: Adds `duration_days`, `expires_at`, and `is_expired` columns
2. **Sets Smart Durations**: Based on how old the wishlist is
3. **Handles Expired Wishlists**: Marks old wishlists as expired and releases funds

### Migration Rules:
- **Wishlists older than 30 days**: Get 7 more days to complete
- **Wishlists 14-30 days old**: Get 14 more days to complete  
- **Wishlists less than 14 days old**: Get 30 days total
- **Fully funded wishlists**: Skipped (no changes needed)
- **Expired wishlists**: Marked as expired, funds released to creators

## How to Run Migration

### Option 1: Admin Dashboard (Recommended)
1. Go to `/admin/migrate-wishlists`
2. Click "Check Status" to see current state
3. Click "Run Migration" to migrate all wishlists
4. View results and statistics

### Option 2: API Endpoint
```bash
# Check migration status
curl -X GET "http://localhost:3000/api/admin/migrate-wishlists" \
  -H "Authorization: admin-token"

# Run migration
curl -X POST "http://localhost:3000/api/admin/migrate-wishlists" \
  -H "Authorization: admin-token"
```

### Option 3: SQL Script
```bash
mysql -u root -p nisapoti_nis < database/migrate_existing_wishlists.sql
```

### Option 4: Node.js Script
```bash
node scripts/migrate-existing-wishlists.js
```

## What Happens After Migration

### For Creators:
1. **Existing wishlists** get appropriate duration based on age
2. **Expired wishlists** release funds to available balance
3. **Active wishlists** continue normally with new expiration system
4. **New wishlists** created with duration selector (7-90 days)

### For Withdrawals:
- **Available balance** now includes funds from expired wishlists
- **Locked funds** only apply to active, non-expired wishlists
- **Withdrawal page** shows correct available vs locked amounts

## Database Changes

### New Columns Added:
```sql
ALTER TABLE wishlist 
ADD COLUMN duration_days INT DEFAULT 30,
ADD COLUMN expires_at TIMESTAMP NULL,
ADD COLUMN is_expired BOOLEAN DEFAULT FALSE;
```

### Updated Queries:
- **Available Balance**: Now includes expired wishlist funds
- **Locked Funds**: Excludes expired wishlists
- **Withdrawal Logic**: Handles both fully funded and expired wishlists

## Monitoring

### Check Migration Status:
```sql
SELECT 
  COUNT(*) as total_wishlists,
  SUM(CASE WHEN duration_days IS NOT NULL AND duration_days > 0 THEN 1 ELSE 0 END) as migrated_wishlists,
  SUM(CASE WHEN is_expired = TRUE THEN 1 ELSE 0 END) as expired_wishlists,
  SUM(CASE WHEN amount_funded >= price THEN 1 ELSE 0 END) as fully_funded_wishlists
FROM wishlist;
```

### Check Expired Wishlists:
```sql
SELECT id, name, expires_at, amount_funded, price 
FROM wishlist 
WHERE expires_at <= NOW() 
  AND is_expired = FALSE
  AND amount_funded < price;
```

## Troubleshooting

### If Migration Fails:
1. Check database connection
2. Ensure user has ALTER TABLE permissions
3. Check for any foreign key constraints
4. Review error logs

### If Creators Report Issues:
1. Check if their wishlists were migrated correctly
2. Verify withdrawal calculations
3. Check if expired wishlists are marked properly

### Rollback (if needed):
```sql
-- Remove new columns (WARNING: This will lose duration data)
ALTER TABLE wishlist 
DROP COLUMN duration_days,
DROP COLUMN expires_at,
DROP COLUMN is_expired;
```

## Support

If you encounter any issues during migration:
1. Check the admin dashboard for detailed error messages
2. Review the migration logs
3. Test with a small subset of wishlists first
4. Contact support if needed

## Next Steps

After successful migration:
1. Set up cron job for automatic expiration processing
2. Monitor withdrawal calculations
3. Inform creators about the new duration feature
4. Update documentation and help guides
