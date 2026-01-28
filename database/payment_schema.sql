-- PawaPay Payment Integration Database Schema
-- Add these tables to support PawaPay payment processing

-- Pending payments table (before payment completion)
CREATE TABLE IF NOT EXISTS pending_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    deposit_id VARCHAR(255) UNIQUE NOT NULL,
    creator_id VARCHAR(255) NOT NULL,
    supporter_name VARCHAR(255) DEFAULT 'Anonymous',
    phone_number VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type ENUM('support', 'wishlist', 'shop') DEFAULT 'support',
    wishlist_id INT NULL,
    wishlist_uuid VARCHAR(255) NULL,
    product_id INT NULL,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_creator_id (creator_id),
    INDEX idx_deposit_id (deposit_id),
    INDEX idx_status (status)
);

-- Payouts table (for creator withdrawals)
CREATE TABLE IF NOT EXISTS payouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    payout_id VARCHAR(255) UNIQUE NOT NULL,
    withdrawal_id VARCHAR(255) NOT NULL,
    creator_id VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_creator_id (creator_id),
    INDEX idx_payout_id (payout_id),
    INDEX idx_status (status)
);

-- Update pending_payments table to include wishlist_uuid
ALTER TABLE pending_payments 
ADD COLUMN IF NOT EXISTS wishlist_uuid VARCHAR(255) NULL;

-- Update supporters table to include PawaPay fields
ALTER TABLE supporters 
ADD COLUMN IF NOT EXISTS deposit_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS wishlist_uuid VARCHAR(255) NULL,
ADD INDEX IF NOT EXISTS idx_deposit_id (deposit_id);

-- Update orders table to include PawaPay fields
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS deposit_id VARCHAR(255) NULL,
ADD INDEX IF NOT EXISTS idx_deposit_id (deposit_id);

-- Add new columns to payment_tokens table
ALTER TABLE payment_tokens 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'support',
ADD COLUMN IF NOT EXISTS product_id VARCHAR(255) NULL;

-- Add buyer_email to pending_payments table
ALTER TABLE pending_payments 
ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(255) NULL;

-- Add duration and expiration fields to wishlist table
ALTER TABLE wishlist 
ADD COLUMN IF NOT EXISTS duration_days INT DEFAULT 30,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS is_expired BOOLEAN DEFAULT FALSE,
ADD INDEX IF NOT EXISTS idx_expires_at (expires_at),
ADD INDEX IF NOT EXISTS idx_is_expired (is_expired);

-- Payment tokens table (for secure URL generation)
CREATE TABLE IF NOT EXISTS payment_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    deposit_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    supporter_name VARCHAR(255) NOT NULL,
    creator_username VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'support',
    product_id VARCHAR(255) NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
);
