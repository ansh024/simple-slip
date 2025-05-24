-- Create database
CREATE DATABASE IF NOT EXISTS simple_slip;

-- Use the database
\c simple_slip;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'staff',
    shop_id INTEGER,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create shops table
CREATE TABLE IF NOT EXISTS shops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    owner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint to users table
ALTER TABLE users ADD CONSTRAINT fk_shop_id FOREIGN KEY (shop_id) REFERENCES shops(id);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_hindi VARCHAR(255),
    unit VARCHAR(50) NOT NULL,
    current_price DECIMAL(10, 2),
    shop_id INTEGER REFERENCES shops(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, shop_id)
);

-- Create price_history table
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES items(id),
    price DECIMAL(10, 2) NOT NULL,
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create slips table
CREATE TABLE IF NOT EXISTS slips (
    id SERIAL PRIMARY KEY,
    slip_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    total_amount DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    final_amount DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    created_by INTEGER REFERENCES users(id),
    shop_id INTEGER REFERENCES shops(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create slip_items table
CREATE TABLE IF NOT EXISTS slip_items (
    id SERIAL PRIMARY KEY,
    slip_id INTEGER REFERENCES slips(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id),
    item_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stock_transfers table
CREATE TABLE IF NOT EXISTS stock_transfers (
    id SERIAL PRIMARY KEY,
    from_shop_id INTEGER REFERENCES shops(id),
    to_shop_id INTEGER REFERENCES shops(id),
    item_id INTEGER REFERENCES items(id),
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    transfer_type VARCHAR(50) DEFAULT 'internal',
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create voice_recordings table
CREATE TABLE IF NOT EXISTS voice_recordings (
    id SERIAL PRIMARY KEY,
    slip_id INTEGER REFERENCES slips(id),
    file_path TEXT,
    transcription TEXT,
    language VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_slips_created_at ON slips(created_at);
CREATE INDEX idx_slips_shop_id ON slips(shop_id);
CREATE INDEX idx_items_shop_id ON items(shop_id);
CREATE INDEX idx_slip_items_slip_id ON slip_items(slip_id);
CREATE INDEX idx_stock_transfers_created_at ON stock_transfers(created_at);

-- Insert sample data
INSERT INTO users (name, phone, password, role) VALUES 
('Admin User', '+919999999999', '$2a$10$YourHashedPasswordHere', 'admin');

-- Create views for reporting
CREATE VIEW daily_summary AS
SELECT 
    DATE(s.created_at) as date,
    s.shop_id,
    COUNT(DISTINCT s.id) as total_slips,
    SUM(s.final_amount) as total_sales,
    COUNT(DISTINCT st.id) as total_transfers,
    SUM(CASE WHEN st.transfer_type = 'internal' THEN st.quantity * i.current_price ELSE 0 END) as transfer_value
FROM slips s
LEFT JOIN stock_transfers st ON s.shop_id = st.from_shop_id AND DATE(s.created_at) = DATE(st.created_at)
LEFT JOIN items i ON st.item_id = i.id
GROUP BY DATE(s.created_at), s.shop_id;

CREATE VIEW item_sales_velocity AS
SELECT 
    i.id,
    i.name,
    i.name_hindi,
    i.shop_id,
    COUNT(DISTINCT si.slip_id) as times_sold,
    SUM(si.quantity) as total_quantity_sold,
    SUM(si.total_price) as total_revenue,
    DATE_PART('day', NOW() - MIN(si.created_at)) as days_since_first_sale,
    CASE 
        WHEN DATE_PART('day', NOW() - MIN(si.created_at)) > 0 
        THEN SUM(si.quantity) / DATE_PART('day', NOW() - MIN(si.created_at))
        ELSE 0 
    END as daily_velocity
FROM items i
LEFT JOIN slip_items si ON i.id = si.item_id
GROUP BY i.id, i.name, i.name_hindi, i.shop_id;
