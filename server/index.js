const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize database (creates tables on first run)
require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/retailer', require('./routes/retailer'));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'SmartCart API is running (SQLite)' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📦 Database: SQLite (smartcart.db)`);
});
