const bcrypt = require('bcryptjs');
require('dotenv').config();
const db = require('./db');

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Clear existing data
    db.exec('DELETE FROM online_prices');
    db.exec('DELETE FROM products');
    db.exec('DELETE FROM retailers');
    db.exec('DELETE FROM users');
    console.log('   Cleared existing data');

    // Hash password for demo accounts
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Create demo user
    db.prepare('INSERT INTO users (name, email, password, lat, lng) VALUES (?, ?, ?, ?, ?)')
      .run('Demo User', 'user@demo.com', hashedPassword, 17.385, 78.4867);
    console.log('   ✅ Created demo user: user@demo.com / password123');

    // Create 5 mock retailers around Hyderabad
    const insertRetailer = db.prepare(
      'INSERT INTO retailers (name, email, password, shop_name, shop_address, phone, whatsapp, timings, category, rating, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const retailers = [
      ['Rahul Sharma', 'retailer@demo.com', hashedPassword, 'TechZone Electronics', 'Ameerpet, Hyderabad', '9876543210', '919876543210', '10:00 AM - 9:00 PM', 'Electronics', 4.5, 17.4375, 78.4483],
      ['Priya Patel', 'priya@shop.com', hashedPassword, 'Fashion Hub', 'Banjara Hills, Hyderabad', '9876543211', '919876543211', '10:30 AM - 8:30 PM', 'Fashion', 4.2, 17.4156, 78.4347],
      ['Arun Kumar', 'arun@shop.com', hashedPassword, 'Kitchen World', 'Secunderabad, Hyderabad', '9876543212', '919876543212', '9:00 AM - 8:00 PM', 'Kitchen', 4.0, 17.4399, 78.4983],
      ['Sneha Reddy', 'sneha@shop.com', hashedPassword, 'Gadget Gallery', 'Kukatpally, Hyderabad', '9876543213', '919876543213', '11:00 AM - 10:00 PM', 'Electronics', 4.8, 17.4947, 78.3996],
      ['Mohammed Ali', 'ali@shop.com', hashedPassword, 'Shoe Palace', 'Begumpet, Hyderabad', '9876543214', '919876543214', '10:00 AM - 9:30 PM', 'Footwear', 4.3, 17.4439, 78.4630],
    ];

    const retailerIds = [];
    for (const r of retailers) {
      const result = insertRetailer.run(...r);
      retailerIds.push(result.lastInsertRowid);
    }
    console.log('   ✅ Created 5 mock retailers');

    // Create products for each retailer
    const insertProduct = db.prepare(
      'INSERT INTO products (name, description, category, barcode, image, retailer_id, price, mrp, discount, stock, availability) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)'
    );

    const products = [
      // TechZone Electronics (retailerIds[0])
      ['iPhone 15 (128GB)', 'Apple iPhone 15 128GB Blue, A16 Bionic chip', 'Electronics', '8901030865404', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', retailerIds[0], 74999, 79900, 6, 5],
      ['Samsung Galaxy S24', 'Samsung Galaxy S24 256GB Marble Gray', 'Electronics', '8901030865411', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400', retailerIds[0], 69999, 74999, 7, 8],
      ['Sony WH-1000XM5', 'Sony Premium Noise Cancelling Headphones', 'Electronics', '8901030865428', 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400', retailerIds[0], 26990, 29990, 10, 12],
      ['HP Laptop 15s', 'HP 15s 12th Gen Intel Core i5, 8GB RAM, 512GB SSD', 'Electronics', '8901030865459', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', retailerIds[0], 42990, 45990, 7, 3],

      // Fashion Hub (retailerIds[1])
      ["Levi's 511 Slim Jeans", "Levi's 511 Slim Fit Blue Jeans for Men", 'Fashion', '8901030865466', 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', retailerIds[1], 2499, 2999, 17, 20],
      ["Allen Solly Formal Shirt", "Allen Solly Men's Slim Fit Cotton Shirt", 'Fashion', '', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400', retailerIds[1], 1299, 1799, 28, 15],

      // Kitchen World (retailerIds[2])
      ['Prestige Mixer Grinder', 'Prestige Iris 750W Mixer Grinder 3 Jars', 'Kitchen', '8901030865442', 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400', retailerIds[2], 2999, 3499, 14, 10],
      ['Butterfly Gas Stove 3B', 'Butterfly Jet 3 Burner Gas Stove', 'Kitchen', '', 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', retailerIds[2], 2799, 3299, 15, 6],

      // Gadget Gallery (retailerIds[3])
      ['iPhone 15 (128GB)', 'Apple iPhone 15 128GB Blue — Best deal!', 'Electronics', '', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400', retailerIds[3], 73499, 79900, 8, 3],
      ['boAt Rockerz 450', 'boAt Rockerz 450 Bluetooth Wireless Headphone', 'Electronics', '8901030865473', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', retailerIds[3], 1499, 1999, 25, 25],
      ['Samsung Galaxy S24', 'Samsung Galaxy S24 256GB — Special Offer', 'Electronics', '', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400', retailerIds[3], 68499, 74999, 9, 4],

      // Shoe Palace (retailerIds[4])
      ['Nike Air Max 270', 'Nike Air Max 270 React Running Shoes', 'Footwear', '8901030865435', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', retailerIds[4], 11495, 12995, 12, 8],
      ['Puma RS-X Sneakers', 'Puma RS-X3 Puzzle Sneakers White', 'Footwear', '', 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400', retailerIds[4], 5999, 7999, 25, 14],
    ];

    for (const p of products) {
      insertProduct.run(...p);
    }
    console.log(`   ✅ Created ${products.length} products`);

    // Create Online Prices (mock data from e-commerce platforms)
    const insertOnline = db.prepare(
      'INSERT INTO online_prices (product_name, platform, price, original_price, url, rating, delivery_days, image, in_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)'
    );

    const onlinePrices = [
      ['iPhone 15 128GB', 'Amazon', 72999, 79900, 'https://amazon.in', 4.5, 2, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400'],
      ['iPhone 15 128GB', 'Flipkart', 73499, 79900, 'https://flipkart.com', 4.4, 3, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400'],
      ['iPhone 15 128GB', 'Croma', 76999, 79900, 'https://croma.com', 4.3, 4, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400'],
      ['Samsung Galaxy S24', 'Amazon', 66999, 74999, 'https://amazon.in', 4.4, 2, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400'],
      ['Samsung Galaxy S24', 'Flipkart', 67499, 74999, 'https://flipkart.com', 4.5, 2, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400'],
      ['Samsung Galaxy S24', 'Samsung Store', 71999, 74999, 'https://samsung.com', 4.6, 3, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400'],
      ['Sony WH-1000XM5', 'Amazon', 24990, 29990, 'https://amazon.in', 4.7, 1, 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400'],
      ['Sony WH-1000XM5', 'Flipkart', 25990, 29990, 'https://flipkart.com', 4.6, 2, 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400'],
      ['HP Laptop 15s i5', 'Amazon', 41990, 45990, 'https://amazon.in', 4.3, 3, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400'],
      ['HP Laptop 15s i5', 'Flipkart', 42490, 45990, 'https://flipkart.com', 4.2, 2, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400'],
      ['HP Laptop 15s i5', 'Croma', 44990, 45990, 'https://croma.com', 4.1, 5, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400'],
      ['Nike Air Max 270', 'Amazon', 10995, 12995, 'https://amazon.in', 4.4, 3, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'],
      ['Nike Air Max 270', 'Myntra', 10495, 12995, 'https://myntra.com', 4.5, 4, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'],
      ['boAt Rockerz 450', 'Amazon', 1299, 1999, 'https://amazon.in', 4.1, 1, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
      ['boAt Rockerz 450', 'Flipkart', 1399, 1999, 'https://flipkart.com', 4.0, 2, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'],
      ['Prestige Mixer Grinder', 'Amazon', 2849, 3499, 'https://amazon.in', 4.2, 3, 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400'],
      ['Prestige Mixer Grinder', 'Flipkart', 2999, 3499, 'https://flipkart.com', 4.3, 2, 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400'],
      ["Levi's 511 Slim Jeans", 'Myntra', 2199, 2999, 'https://myntra.com', 4.3, 3, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'],
      ["Levi's 511 Slim Jeans", 'Amazon', 2399, 2999, 'https://amazon.in', 4.2, 2, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'],
      ['Puma RS-X Sneakers', 'Myntra', 5499, 7999, 'https://myntra.com', 4.4, 4, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400'],
      ['Puma RS-X Sneakers', 'Amazon', 5799, 7999, 'https://amazon.in', 4.3, 3, 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400'],
    ];

    for (const op of onlinePrices) {
      insertOnline.run(...op);
    }
    console.log(`   ✅ Created ${onlinePrices.length} online price entries`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Demo accounts:');
    console.log('  User:     user@demo.com / password123');
    console.log('  Retailer: retailer@demo.com / password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (err) {
    console.error('❌ Seeding error:', err);
  }
}

seed();
