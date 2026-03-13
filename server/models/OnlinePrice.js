const mongoose = require('mongoose');

const onlinePriceSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  platform: { type: String, required: true },  // Amazon, Flipkart, Croma, etc.
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  url: { type: String, default: '#' },
  rating: { type: Number, default: 4.0 },
  deliveryDays: { type: Number, default: 3 },
  image: { type: String, default: 'https://via.placeholder.com/300x300?text=Product' },
  inStock: { type: Boolean, default: true }
});

// Text index for search
onlinePriceSchema.index({ productName: 'text' });

module.exports = mongoose.model('OnlinePrice', onlinePriceSchema);
