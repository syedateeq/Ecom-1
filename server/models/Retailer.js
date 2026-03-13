const mongoose = require('mongoose');

const retailerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  shopName: { type: String, required: true },
  shopAddress: { type: String, default: '' },
  phone: { type: String, default: '' },
  category: { type: String, default: 'General' },
  rating: { type: Number, default: 4.0 },
  location: {
    lat: { type: Number, default: 17.385 },
    lng: { type: Number, default: 78.4867 }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Retailer', retailerSchema);
