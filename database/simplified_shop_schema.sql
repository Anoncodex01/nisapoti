-- Simplified Shop Database Schema for Nisapoti
-- Digital products only (ebooks, podcasts, tutorials) with TZS currency
-- Run these commands in your MySQL database

-- Products table for digital content
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    creator_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    feature_image_url VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL, -- Always in TZS
    category VARCHAR(100),
    
    -- Success page options
    success_page_type ENUM('confirmation', 'redirect') DEFAULT 'confirmation',
    confirmation_message TEXT,
    redirect_url VARCHAR(500),
    
    -- File/content delivery
    file_url VARCHAR(500), -- For downloadable files (ebooks, etc.)
    content_url VARCHAR(500), -- For links (podcasts, tutorials, etc.)
    
    -- Inventory management
    limit_slots BOOLEAN DEFAULT FALSE,
    max_slots INT DEFAULT NULL, -- Only used if limit_slots is TRUE
    sold_slots INT DEFAULT 0,
    allow_quantity BOOLEAN DEFAULT FALSE,
    
    -- Status and metadata
    status ENUM('active', 'inactive', 'draft') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint (temporarily removed for compatibility)
    -- FOREIGN KEY (creator_id) REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Indexes for better performance
    INDEX idx_creator_id (creator_id),
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
);

-- Simple orders table for purchases
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    creator_id VARCHAR(36) NOT NULL,
    buyer_user_id VARCHAR(36), -- Can be NULL for guest purchases
    buyer_email VARCHAR(255) NOT NULL,
    buyer_name VARCHAR(255) NOT NULL,
    
    -- Order details
    product_id INT NOT NULL,
    product_title VARCHAR(255) NOT NULL, -- Store title at time of purchase
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL, -- Always in TZS
    total_amount DECIMAL(10, 2) NOT NULL, -- Always in TZS
    
    -- Payment and status
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    
    -- Buyer's answer to optional question
    buyer_answer TEXT, -- If creator asked a question
    
    -- Timestamps
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys (temporarily removed for compatibility)
    -- FOREIGN KEY (creator_id) REFERENCES profiles(id) ON DELETE CASCADE,
    -- FOREIGN KEY (buyer_user_id) REFERENCES profiles(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_creator_id (creator_id),
    INDEX idx_buyer_user_id (buyer_user_id),
    INDEX idx_product_id (product_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_order_date (order_date),
    INDEX idx_order_number (order_number)
);

-- Product categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(10) DEFAULT '📦',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shopping cart for logged-in users (optional)
CREATE TABLE IF NOT EXISTS shopping_cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    -- Ensure unique cart items per user
    UNIQUE KEY unique_cart_item (user_id, product_id),
    INDEX idx_user_id (user_id)
);

-- Insert default categories
INSERT INTO product_categories (name, slug, icon, description) VALUES
('E-books', 'ebooks', '📚', 'Digital books and publications'),
('Podcasts', 'podcasts', '🎧', 'Audio content and podcast episodes'),
('Tutorials', 'tutorials', '🎓', 'Educational content and how-to guides'),
('Courses', 'courses', '📖', 'Online courses and learning materials'),
('Templates', 'templates', '📄', 'Digital templates and resources'),
('Software', 'software', '💻', 'Digital software and applications'),
('Music', 'music', '🎵', 'Audio tracks and music content'),
('Videos', 'videos', '🎬', 'Video content and recordings')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- How the shop works:
-- 1. Creator creates a product with title, description, image, price (TZS)
-- 2. Creator chooses success page (confirmation message OR redirect URL)
-- 3. Creator uploads file OR provides content link
-- 4. Creator can optionally limit slots and allow quantity selection
-- 5. Buyers purchase and receive access to content
-- 6. No physical shipping, no variants, no complex inventory
