const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' },
  barcode: { type: String, default: '' },
  image: { type: String, default: 'https://via.placeholder.com/300x300?text=Product' },
  retailerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Retailer', required: true },
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  discount: { type: Number, default: 0 },  // discount percentage
  stock: { type: Number, default: 10 },
  availability: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Text index for search
productSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
