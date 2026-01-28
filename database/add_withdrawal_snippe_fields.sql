-- Add Snippe payout fields to withdrawals table
ALTER TABLE withdrawals
ADD COLUMN IF NOT EXISTS payout_reference VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) NULL,
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2) NULL;

-- Add index for payout reference
CREATE INDEX IF NOT EXISTS idx_payout_reference ON withdrawals(payout_reference);
