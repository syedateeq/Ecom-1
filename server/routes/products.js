const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper: Calculate distance between two lat/lng points (in km)
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Helper: Compute recommendation labels
function computeRecommendations(onlinePrices, offlineProducts) {
  const recommendations = {};

  // Cheapest Online
  if (onlinePrices.length > 0) {
    const cheapest = onlinePrices.reduce((min, p) => p.price < min.price ? p : min, onlinePrices[0]);
    recommendations.cheapestOnline = { ...cheapest, label: 'Cheapest Online' };
  }

  // Best Nearby Shop (cheapest offline within 10km)
  const nearbyOffline = offlineProducts.filter(p => p.distance <= 10);
  if (nearbyOffline.length > 0) {
    const bestNearby = nearbyOffline.reduce((min, p) => p.price < min.price ? p : min, nearbyOffline[0]);
    recommendations.bestNearbyShop = { ...bestNearby, label: 'Best Nearby Shop' };
  }

  // Best Overall Value (weighted score)
  const allOptions = [
    ...onlinePrices.map(p => ({
      ...p, type: 'online',
      savings: ((p.originalPrice - p.price) / p.originalPrice) * 100,
      distance: 0
    })),
    ...offlineProducts.map(p => ({
      ...p, type: 'offline',
      savings: ((p.mrp - p.price) / p.mrp) * 100
    }))
  ];

  if (allOptions.length > 0) {
    const scored = allOptions.map(opt => ({
      ...opt,
      score: (opt.savings * 0.4) + ((opt.rating || 4) * 10 * 0.3) + ((1 / (opt.distance + 1)) * 100 * 0.2) + ((opt.inStock !== false && opt.inStock !== 0) ? 10 : 0) * 0.1
    }));
    const best = scored.reduce((max, o) => o.score > max.score ? o : max, scored[0]);
    recommendations.bestOverallValue = { ...best, label: 'Best Overall Value' };
  }

  return recommendations;
}

// GET /api/products/search?q=iphone&lat=17.385&lng=78.4867&budget=50000&sort=price
router.get('/search', (req, res) => {
  try {
    const { q, lat, lng, budget, sort } = req.query;
    if (!q) return res.status(400).json({ message: 'Search query is required' });

    const userLat = parseFloat(lat) || 17.385;
    const userLng = parseFloat(lng) || 78.4867;
    const maxBudget = budget ? parseFloat(budget) : Infinity;

    // Build search terms for LIKE matching
    const searchTerms = q.split(/\s+/).filter(Boolean);
    
    // Search online prices
    let onlinePrices = db.prepare(`
      SELECT * FROM online_prices 
      WHERE ${searchTerms.map(() => 'product_name LIKE ?').join(' OR ')}
    `).all(...searchTerms.map(t => `%${t}%`));

    if (maxBudget !== Infinity) {
      onlinePrices = onlinePrices.filter(p => p.price <= maxBudget);
    }

    // Map online prices to consistent format
    onlinePrices = onlinePrices.map(p => ({
      id: p.id,
      productName: p.product_name,
      platform: p.platform,
      price: p.price,
      originalPrice: p.original_price,
      url: p.url,
      rating: p.rating,
      deliveryDays: p.delivery_days,
      image: p.image,
      inStock: p.in_stock,
      type: 'online'
    }));

    // Search offline products with retailer info (JOIN)
    let offlineProducts = db.prepare(`
      SELECT p.*, r.shop_name, r.shop_address, r.rating as shop_rating, r.lat as r_lat, r.lng as r_lng
      FROM products p
      JOIN retailers r ON p.retailer_id = r.id
      WHERE p.availability = 1 AND (${searchTerms.map(() => 'p.name LIKE ? OR p.category LIKE ? OR p.description LIKE ?').join(' OR ')})
    `).all(...searchTerms.flatMap(t => [`%${t}%`, `%${t}%`, `%${t}%`]));

    if (maxBudget !== Infinity) {
      offlineProducts = offlineProducts.filter(p => p.price <= maxBudget);
    }

    // Calculate distance for each offline product
    offlineProducts = offlineProducts.map(p => {
      const distance = getDistance(userLat, userLng, p.r_lat || 17.385, p.r_lng || 78.4867);
      return {
        _id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        image: p.image,
        price: p.price,
        mrp: p.mrp,
        discount: p.discount,
        stock: p.stock,
        availability: p.availability,
        shopName: p.shop_name || 'Unknown Shop',
        shopAddress: p.shop_address || '',
        shopRating: p.shop_rating || 4.0,
        rating: p.shop_rating || 4.0,
        distance: Math.round(distance * 10) / 10,
        type: 'offline'
      };
    });

    // Sort results
    if (sort === 'price') {
      onlinePrices.sort((a, b) => a.price - b.price);
      offlineProducts.sort((a, b) => a.price - b.price);
    } else if (sort === 'distance') {
      offlineProducts.sort((a, b) => a.distance - b.distance);
    } else if (sort === 'rating') {
      onlinePrices.sort((a, b) => b.rating - a.rating);
      offlineProducts.sort((a, b) => b.rating - a.rating);
    }

    // Compute recommendation labels
    const recommendations = computeRecommendations(onlinePrices, offlineProducts);

    res.json({
      query: q,
      onlinePrices,
      offlineProducts,
      recommendations,
      totalResults: onlinePrices.length + offlineProducts.length
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/products/:id — Get a specific offline product detail
router.get('/:id', (req, res) => {
  try {
    const product = db.prepare(`
      SELECT p.*, r.shop_name, r.shop_address, r.rating as shop_rating, r.phone as shop_phone, r.lat as r_lat, r.lng as r_lng, r.id as retailer_id
      FROM products p
      JOIN retailers r ON p.retailer_id = r.id
      WHERE p.id = ?
    `).get(req.params.id);

    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Get online prices for similar products
    const nameWords = product.name.split(' ').slice(0, 2);
    const onlinePrices = db.prepare(`
      SELECT * FROM online_prices 
      WHERE ${nameWords.map(() => 'product_name LIKE ?').join(' OR ')}
    `).all(...nameWords.map(w => `%${w}%`));

    // Format response to match what frontend expects
    const formattedProduct = {
      _id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      image: product.image,
      price: product.price,
      mrp: product.mrp,
      discount: product.discount,
      stock: product.stock,
      availability: product.availability,
      retailerId: {
        _id: product.retailer_id,
        shopName: product.shop_name,
        shopAddress: product.shop_address,
        rating: product.shop_rating,
        phone: product.shop_phone
      }
    };

    const formattedOnline = onlinePrices.map(p => ({
      productName: p.product_name,
      platform: p.platform,
      price: p.price,
      originalPrice: p.original_price,
      url: p.url,
      rating: p.rating,
      deliveryDays: p.delivery_days,
      image: p.image,
      inStock: p.in_stock
    }));

    res.json({ product: formattedProduct, onlinePrices: formattedOnline });
  } catch (err) {
    console.error('Product detail error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
