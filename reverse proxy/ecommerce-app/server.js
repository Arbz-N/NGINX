const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'ecommerce_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

function log(msg) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync('/var/log/ecommerce-app.log', `[${timestamp}] ${msg}\n`);
}

async function initDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root'
    });

    await connection.execute('CREATE DATABASE IF NOT EXISTS ecommerce_db');
    await connection.execute('USE ecommerce_db');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        rating DECIMAL(3, 2) DEFAULT 4.5,
        reviews INT DEFAULT 0,
        stock INT DEFAULT 0,
        image LONGBLOB,
        image_mime VARCHAR(50),
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cart (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255),
        product_id INT NOT NULL,
        quantity INT DEFAULT 1,
        size VARCHAR(10),
        color VARCHAR(50),
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20),
        address TEXT,
        total DECIMAL(10, 2),
        status ENUM('pending', 'confirmed', 'shipped', 'delivered'),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert sample products
    const checkProducts = await connection.execute('SELECT COUNT(*) as count FROM products');
    if (checkProducts[0][0].count === 0) {
      await connection.execute(`
        INSERT INTO products (name, slug, description, price, rating, reviews, stock, category)
        VALUES
        ('Nike Air Max 270', 'nike-air-max-270', 'Premium sneaker with Air Max technology', 290.00, 4.5, 60, 50, 'Shoes'),
        ('Premium Running Shoes', 'premium-running-shoes', 'High performance running shoe', 189.99, 4.3, 45, 30, 'Shoes'),
        ('Classic Leather Sneaker', 'classic-leather-sneaker', 'Timeless design with comfort', 149.99, 4.7, 80, 40, 'Shoes'),
        ('Sports Basketball Shoe', 'sports-basketball-shoe', 'Perfect for court and street', 159.99, 4.4, 55, 25, 'Shoes'),
        ('Casual Canvas Shoe', 'casual-canvas-shoe', 'Everyday wear comfort', 89.99, 4.2, 35, 60, 'Shoes'),
        ('Athletic Running Shoe', 'athletic-running-shoe', 'Lightweight and responsive', 129.99, 4.6, 72, 35, 'Shoes')
      `);
    }

    await connection.end();
    log('Database initialized');
  } catch (error) {
    log('Database error: ' + error.message);
  }
}

// Pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/shop', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});

app.get('/product/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product-detail.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

// API - Products
app.get('/api/products', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [products] = await connection.execute(`
      SELECT id, name, slug, description, price, rating, reviews, stock, category FROM products
    `);
    connection.release();
    res.json({ success: true, data: products });
    log('GET /api/products - ' + products.length + ' products');
  } catch (error) {
    log('Error: ' + error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/products/:slug', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [products] = await connection.execute(
      'SELECT id, name, slug, description, price, rating, reviews, stock, category FROM products WHERE slug = ?',
      [req.params.slug]
    );
    connection.release();
    res.json({ success: true, data: products[0] || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API - Cart
app.get('/api/cart', async (req, res) => {
  try {
    const sessionId = req.query.sessionId;
    const connection = await pool.getConnection();
    const [items] = await connection.execute(`
      SELECT c.*, p.name, p.price, p.category
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.session_id = ?
    `, [sessionId]);
    connection.release();
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/cart', async (req, res) => {
  const { sessionId, productId, quantity, size, color } = req.body;
  try {
    const connection = await pool.getConnection();
    await connection.execute(
      'INSERT INTO cart (session_id, product_id, quantity, size, color) VALUES (?, ?, ?, ?, ?)',
      [sessionId, productId, quantity, size, color]
    );
    connection.release();
    res.json({ success: true });
    log('POST /api/cart');
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/cart/:cartId', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('DELETE FROM cart WHERE id = ?', [req.params.cartId]);
    connection.release();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API - Orders
app.post('/api/orders', async (req, res) => {
  const { customerName, customerEmail, customerPhone, address, total } = req.body;
  try {
    const connection = await pool.getConnection();
    const result = await connection.execute(
      'INSERT INTO orders (customer_name, customer_email, customer_phone, address, total, status) VALUES (?, ?, ?, ?, ?, ?)',
      [customerName, customerEmail, customerPhone, address, total, 'pending']
    );
    connection.release();
    res.json({ success: true, orderId: result[0].insertId });
    log('POST /api/orders - Order created');
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stats
app.get('/api/stats', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [products] = await connection.execute('SELECT COUNT(*) as count FROM products');
    const [orders] = await connection.execute('SELECT COUNT(*) as count FROM orders');
    connection.release();

    res.json({
      success: true,
      data: {
        totalProducts: products[0].count,
        totalOrders: orders[0].count,
        cartItems: 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      log('Server started on port ' + PORT);
    });
  } catch (error) {
    log('Error: ' + error.message);
    process.exit(1);
  }
}

start();

process.on('SIGINT', () => {
  log('Shutting down');
  process.exit(0);
});