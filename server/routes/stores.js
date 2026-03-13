const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper: Haversine distance between two lat/lng points (in km)
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/stores/nearby?lat=17.385&lng=78.4867&radius=10
router.get('/nearby', (req, res) => {
  try {
    const userLat = parseFloat(req.query.lat) || 17.385;
    const userLng = parseFloat(req.query.lng) || 78.4867;
    const radius = parseFloat(req.query.radius) || 10;

    // Fetch all retailers
    const retailers = db
      .prepare(
        'SELECT id, name, email, shop_name, shop_address, phone, whatsapp, timings, category, rating, lat, lng FROM retailers'
      )
      .all();

    // Fetch all available products
    const products = db
      .prepare(
        'SELECT id, name, price, mrp, discount, stock, availability, category, image, retailer_id FROM products WHERE availability = 1'
      )
      .all();

    // Group products by retailer_id
    const productsByRetailer = {};
    for (const p of products) {
      if (!productsByRetailer[p.retailer_id]) productsByRetailer[p.retailer_id] = [];
      productsByRetailer[p.retailer_id].push({
        id: p.id,
        name: p.name,
        price: p.price,
        mrp: p.mrp,
        discount: p.discount,
        stock: p.stock,
        category: p.category,
        image: p.image,
      });
    }

    // Build shop list with distance and product data
    const shops = retailers
      .map((r) => {
        const dist = getDistance(userLat, userLng, r.lat || 17.385, r.lng || 78.4867);
        const shopProducts = productsByRetailer[r.id] || [];
        const prices = shopProducts.map((p) => p.price);
        const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

        return {
          id: r.id,
          name: r.name,
          shopName: r.shop_name,
          shopAddress: r.shop_address,
          phone: r.phone,
          whatsapp: r.whatsapp,
          timings: r.timings,
          category: r.category,
          rating: r.rating,
          lat: r.lat,
          lng: r.lng,
          distance: Math.round(dist * 10) / 10,
          totalProducts: shopProducts.length,
          inStockCount: shopProducts.filter((p) => p.stock > 0).length,
          avgPrice: Math.round(avgPrice),
          priceRange:
            shopProducts.length > 0
              ? {
                  min: Math.min(...prices),
                  max: Math.max(...prices),
                }
              : null,
          featuredProduct: shopProducts.length > 0 ? shopProducts[0] : null,
          products: shopProducts.slice(0, 5),
          cheapest: false, // will be set below
        };
      })
      .filter((s) => s.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    // Mark the cheapest store (lowest avgPrice among stores that have products)
    const storesWithProducts = shops.filter((s) => s.totalProducts > 0);
    if (storesWithProducts.length > 0) {
      const cheapestStore = storesWithProducts.reduce((min, s) =>
        s.avgPrice < min.avgPrice ? s : min
      );
      const match = shops.find((s) => s.id === cheapestStore.id);
      if (match) match.cheapest = true;
    }

    res.json({
      userLocation: { lat: userLat, lng: userLng },
      radius,
      totalShops: shops.length,
      shops,
    });
  } catch (err) {
    console.error('Nearby stores error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
