
-- Main referrals table to track referral clicks and conversions
CREATE TABLE IF NOT EXISTS referrals (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    referrer_user_id VARCHAR(36) NOT NULL,
    referral_code VARCHAR(100) NOT NULL,
    referred_email VARCHAR(255) NULL,
    referred_user_id VARCHAR(36) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    referrer_url VARCHAR(500) NULL,
    status ENUM('clicked', 'converted', 'completed') DEFAULT 'clicked',
    conversion_type ENUM('signup', 'first_support', 'profile_complete', 'first_product') NULL,
    conversion_value DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    converted_at TIMESTAMP NULL,
    INDEX idx_referrer_user (referrer_user_id),
    INDEX idx_referral_code (referral_code),
    INDEX idx_referred_user (referred_user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS referral_campaigns (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    value DECIMAL(10,2) DEFAULT 0.00,
    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,
    target_audience VARCHAR(50) DEFAULT 'all',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referral_reward_tiers (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    tier_level INT NOT NULL,
    invites_required INT NOT NULL,
    reward_title VARCHAR(255) NOT NULL,
    reward_description TEXT,
    reward_type ENUM('digital', 'physical', 'status', 'service') DEFAULT 'digital',
    status ENUM('locked', 'unlocked', 'claimed', 'shipped') DEFAULT 'locked',
    unlocked_at TIMESTAMP NULL,
    claimed_at TIMESTAMP NULL,
    shipped_at TIMESTAMP NULL,
    tracking_number VARCHAR(100) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_tier_level (tier_level),
    INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS referral_conversions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    referral_id VARCHAR(36) NOT NULL,
    referred_user_id VARCHAR(36) NOT NULL,
    conversion_type ENUM('signup', 'first_support', 'profile_complete', 'first_product') NOT NULL,
    conversion_value DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_referral (referral_id),
    INDEX idx_referred_user (referred_user_id),
    INDEX idx_conversion_type (conversion_type)
);

CREATE TABLE IF NOT EXISTS referral_admin_actions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    admin_user_id VARCHAR(36) NOT NULL,
    target_user_id VARCHAR(36) NOT NULL,
    action_type ENUM('unlock_reward', 'ship_reward', 'deny_reward', 'add_invites', 'remove_invites') NOT NULL,
    reward_tier_id VARCHAR(36) NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_user (admin_user_id),
    INDEX idx_target_user (target_user_id),
    INDEX idx_action_type (action_type)
);

INSERT INTO referral_campaigns (id, name, description, type, value, start_date, end_date, target_audience)
VALUES (
    UUID(),
    'Creator Referral Program',
    'Invite creator friends and unlock exclusive rewards',
    'fixed_bonus',
    0.00,
    NOW(),
    DATE_ADD(NOW(), INTERVAL 2 YEAR),
    'creators'
) ON DUPLICATE KEY UPDATE name = VALUES(name);