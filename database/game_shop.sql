-- Create Database
CREATE DATABASE IF NOT EXISTS game_shop;
USE game_shop;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50),
    stock INT DEFAULT 0,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Insert sample admin user (password: admin123 - hashed with bcrypt)
INSERT IGNORE INTO users (username, email, password, full_name, is_admin) 
VALUES ('admin', 'admin@gameshop.com', '$2y$10$abcdefghijklmnopqrstuvwxyz', 'Administrator', TRUE);

-- Insert sample products
INSERT IGNORE INTO products (name, description, price, category, stock, image_url) VALUES
('Elden Ring', 'Action RPG from FromSoftware', 59.99, 'RPG', 50, 'images/eldenring.jpg'),
('Cyberpunk 2077', 'Action RPG set in futuristic city', 39.99, 'RPG', 30, 'images/cyberpunk.jpg'),
('The Witcher 3', 'Open-world RPG adventure', 29.99, 'RPG', 45, 'images/witcher3.jpg'),
('Minecraft', 'Sandbox building game', 26.95, 'Sandbox', 100, 'images/minecraft.jpg'),
('Fortnite', 'Battle Royale game', 0.00, 'Shooter', 999, 'images/fortnite.jpg');
