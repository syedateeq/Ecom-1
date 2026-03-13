const Database = require('better-sqlite3');
const path = require('path');

// Create/connect to SQLite database file in server directory
const dbPath = path.join(__dirname, 'smartcart.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    lat REAL DEFAULT 17.385,
    lng REAL DEFAULT 78.4867,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS retailers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    shop_name TEXT NOT NULL,
    shop_address TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    category TEXT DEFAULT 'General',
    rating REAL DEFAULT 4.0,
    lat REAL DEFAULT 17.385,
    lng REAL DEFAULT 78.4867,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'General',
    barcode TEXT DEFAULT '',
    image TEXT DEFAULT 'https://via.placeholder.com/300x300?text=Product',
    retailer_id INTEGER NOT NULL,
    price REAL NOT NULL,
    mrp REAL NOT NULL,
    discount REAL DEFAULT 0,
    stock INTEGER DEFAULT 10,
    availability INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS online_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT NOT NULL,
    platform TEXT NOT NULL,
    price REAL NOT NULL,
    original_price REAL NOT NULL,
    url TEXT DEFAULT '#',
    rating REAL DEFAULT 4.0,
    delivery_days INTEGER DEFAULT 3,
    image TEXT DEFAULT 'https://via.placeholder.com/300x300?text=Product',
    in_stock INTEGER DEFAULT 1
  );
`);

module.exports = db;
