-- Add Snippe payment fields to pending_payments table
-- This migration adds payment_reference and payment_provider columns

ALTER TABLE pending_payments 
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS failure_reason TEXT NULL;

-- Add index for payment_reference for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_reference ON pending_payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payment_provider ON pending_payments(payment_provider);
