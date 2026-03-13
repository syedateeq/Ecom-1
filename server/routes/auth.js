const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// ============ USER AUTH ============

// POST /api/auth/user/signup
router.post('/user/signup', async (req, res) => {
  try {
    const { name, email, password, lat, lng } = req.body;

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Create user
    const result = db.prepare(
      'INSERT INTO users (name, email, password, lat, lng) VALUES (?, ?, ?, ?, ?)'
    ).run(name, email, hashed, lat || 17.385, lng || 78.4867);

    const userId = result.lastInsertRowid;

    // Generate JWT
    const token = jwt.sign({ id: userId, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: userId, name, email, role: 'user' }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/user/login
router.post('/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: 'user' }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ============ RETAILER AUTH ============

// POST /api/auth/retailer/signup
router.post('/retailer/signup', async (req, res) => {
  try {
    const { name, email, password, shopName, shopAddress, phone, category, lat, lng } = req.body;

    const existing = db.prepare('SELECT id FROM retailers WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ message: 'Retailer already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const result = db.prepare(
      'INSERT INTO retailers (name, email, password, shop_name, shop_address, phone, category, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, email, hashed, shopName, shopAddress || '', phone || '', category || 'General', lat || 17.385, lng || 78.4867);

    const retailerId = result.lastInsertRowid;

    const token = jwt.sign({ id: retailerId, role: 'retailer' }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: retailerId, name, email, shopName, role: 'retailer' }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/retailer/login
router.post('/retailer/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const retailer = db.prepare('SELECT * FROM retailers WHERE email = ?').get(email);
    if (!retailer) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, retailer.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: retailer.id, role: 'retailer' }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: retailer.id, name: retailer.name, email: retailer.email, shopName: retailer.shop_name, role: 'retailer' }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
