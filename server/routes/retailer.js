const express = require('express');
const router = express.Router();
const { auth, retailerOnly } = require('../middleware/auth');
const db = require('../db');

// Mock barcode database for quick product lookup
const BARCODE_DB = {
  '8901030865404': { name: 'iPhone 15 (128GB)', category: 'Electronics', mrp: 79900, description: 'Apple iPhone 15 128GB Blue' },
  '8901030865411': { name: 'Samsung Galaxy S24', category: 'Electronics', mrp: 74999, description: 'Samsung Galaxy S24 256GB' },
  '8901030865428': { name: 'Sony WH-1000XM5', category: 'Electronics', mrp: 29990, description: 'Sony Noise Cancelling Headphones' },
  '8901030865435': { name: 'Nike Air Max 270', category: 'Footwear', mrp: 12995, description: 'Nike Air Max Running Shoes' },
  '8901030865442': { name: 'Prestige Mixer Grinder', category: 'Kitchen', mrp: 3499, description: 'Prestige Iris 750W Mixer Grinder' },
  '8901030865459': { name: 'HP Laptop 15s', category: 'Electronics', mrp: 45990, description: 'HP 15s 12th Gen Intel i5 Laptop' },
  '8901030865466': { name: "Levi's 511 Slim Jeans", category: 'Fashion', mrp: 2999, description: "Levi's 511 Slim Fit Men's Jeans" },
  '8901030865473': { name: 'boAt Rockerz 450', category: 'Electronics', mrp: 1999, description: 'boAt Rockerz 450 Wireless Headphone' },
  '0000000000000': { name: 'Test Product', category: 'General', mrp: 999, description: 'A test product for demo' },
};

// GET /api/retailer/profile
router.get('/profile', auth, retailerOnly, (req, res) => {
  try {
    const retailer = db.prepare('SELECT id, name, email, shop_name, shop_address, phone, category, rating, lat, lng FROM retailers WHERE id = ?').get(req.user.id);
    if (!retailer) return res.status(404).json({ message: 'Retailer not found' });

    // Map to camelCase for frontend
    res.json({
      _id: retailer.id,
      name: retailer.name,
      email: retailer.email,
      shopName: retailer.shop_name,
      shopAddress: retailer.shop_address,
      phone: retailer.phone,
      category: retailer.category,
      rating: retailer.rating
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/retailer/profile
router.put('/profile', auth, retailerOnly, async (req, res) => {
  try {
    const { shopName, shopAddress, phone, category, lat, lng } = req.body;
    
    const updates = [];
    const values = [];
    if (shopName) { updates.push('shop_name = ?'); values.push(shopName); }
    if (shopAddress) { updates.push('shop_address = ?'); values.push(shopAddress); }
    if (phone) { updates.push('phone = ?'); values.push(phone); }
    if (category) { updates.push('category = ?'); values.push(category); }
    if (lat && lng) { updates.push('lat = ?, lng = ?'); values.push(lat, lng); }

    // Auto-geocode if address changed but no lat/lng provided
    if (shopAddress && !(lat && lng)) {
      try {
        const { geocodeAddress } = require('../utils/geocoder');
        const geo = await geocodeAddress(shopAddress);
        if (geo) {
          updates.push('lat = ?, lng = ?');
          values.push(geo.lat, geo.lng);
        }
      } catch (geoErr) {
        console.warn('Auto-geocode skipped:', geoErr.message);
      }
    }

    if (updates.length > 0) {
      values.push(req.user.id);
      db.prepare(`UPDATE retailers SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const retailer = db.prepare('SELECT id, name, email, shop_name, shop_address, phone, category, rating FROM retailers WHERE id = ?').get(req.user.id);
    res.json({
      _id: retailer.id,
      name: retailer.name,
      email: retailer.email,
      shopName: retailer.shop_name,
      shopAddress: retailer.shop_address,
      phone: retailer.phone,
      category: retailer.category,
      rating: retailer.rating
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/retailer/products
router.get('/products', auth, retailerOnly, (req, res) => {
  try {
    const products = db.prepare('SELECT * FROM products WHERE retailer_id = ? ORDER BY created_at DESC').all(req.user.id);
    
    // Map to frontend-expected format
    const mapped = products.map(p => ({
      _id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      barcode: p.barcode,
      image: p.image,
      price: p.price,
      mrp: p.mrp,
      discount: p.discount,
      stock: p.stock,
      availability: p.availability === 1
    }));
    
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/retailer/products
router.post('/products', auth, retailerOnly, (req, res) => {
  try {
    const { name, description, category, barcode, image, price, mrp, discount, stock } = req.body;
    
    const result = db.prepare(
      'INSERT INTO products (name, description, category, barcode, image, price, mrp, discount, stock, retailer_id, availability) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)'
    ).run(
      name, description || '', category || 'General', barcode || '',
      image || 'https://via.placeholder.com/300x300?text=Product',
      price, mrp, discount || 0, stock || 10, req.user.id
    );

    res.status(201).json({
      _id: result.lastInsertRowid,
      name, description, category, barcode, image, price, mrp,
      discount: discount || 0, stock: stock || 10, availability: true
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/retailer/products/:id
router.put('/products/:id', auth, retailerOnly, (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND retailer_id = ?').get(req.params.id, req.user.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { name, description, category, image, price, mrp, discount, stock, availability } = req.body;
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (category !== undefined) { updates.push('category = ?'); values.push(category); }
    if (image !== undefined) { updates.push('image = ?'); values.push(image); }
    if (price !== undefined) { updates.push('price = ?'); values.push(price); }
    if (mrp !== undefined) { updates.push('mrp = ?'); values.push(mrp); }
    if (discount !== undefined) { updates.push('discount = ?'); values.push(discount); }
    if (stock !== undefined) { updates.push('stock = ?'); values.push(stock); }
    if (availability !== undefined) { updates.push('availability = ?'); values.push(availability ? 1 : 0); }

    if (updates.length > 0) {
      values.push(req.params.id);
      db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({
      _id: updated.id,
      name: updated.name,
      description: updated.description,
      category: updated.category,
      image: updated.image,
      price: updated.price,
      mrp: updated.mrp,
      discount: updated.discount,
      stock: updated.stock,
      availability: updated.availability === 1
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/retailer/products/:id
router.delete('/products/:id', auth, retailerOnly, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM products WHERE id = ? AND retailer_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/retailer/barcode/:code
router.get('/barcode/:code', auth, retailerOnly, (req, res) => {
  try {
    const info = BARCODE_DB[req.params.code];
    if (!info) return res.status(404).json({ message: 'Barcode not found. Please enter details manually.' });
    res.json(info);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
