const express = require('express');
const router = express.Router();
const db = require('../db');
const { fetchGoogleShopping } = require('../services/serpapi');
const { fetchAmazonProducts } = require('../services/rainforest');
const { fetchPriceApiProducts } = require('../services/priceapi');
const { normalizeAndMerge } = require('../services/normalizer');
const { extractProductName } = require('../utils/urlExtractor');

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

/**
 * POST /api/compare-product
 *
 * Body: { "query": "iphone 15" }   or   { "query": "https://amazon.in/dp/B0CHX1W1XY" }
 *
 * Response: {
 *   product: "Apple iPhone 15",
 *   onlineStores: [],
 *   offlineStores: [],
 *   bestPrice: {},
 *   totalStores: number
 * }
 */
router.post('/compare-product', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // ── Step 1: Detect input type & extract product name ───────────────────
    let productName;
    let platform = null;
    let resolvedUrl = null;
    let isUrl = false;

    try {
      const extraction = await extractProductName(query);
      productName = extraction.productName;
      platform = extraction.platform;
      resolvedUrl = extraction.resolvedUrl;
      isUrl = extraction.isUrl;
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!productName) {
      return res.status(400).json({ message: 'Unable to determine product name from input' });
    }

    const userLat = parseFloat(req.body.lat) || 17.385;
    const userLng = parseFloat(req.body.lng) || 78.4867;

    // ── Step 2: Fetch real-time online prices from all 3 APIs in parallel ──
    const [serpResults, rainforestResults, priceResults] = await Promise.allSettled([
      fetchGoogleShopping(productName),
      fetchAmazonProducts(productName),
      fetchPriceApiProducts(productName),
    ]).then((results) =>
      results.map((r) => (r.status === 'fulfilled' ? r.value : []))
    );

    // Merge and normalise all online results
    const onlineStores = normalizeAndMerge(serpResults, rainforestResults, priceResults);

    // ── Step 3: Search SQLite for matching offline/retailer products ────────
    const searchTerms = productName.split(/\s+/).filter((w) => w.length > 1).slice(0, 6);
    let offlineStores = [];

    if (searchTerms.length > 0) {
      const whereClause = searchTerms
        .map(() => 'p.name LIKE ? OR p.category LIKE ? OR p.description LIKE ?')
        .join(' OR ');

      const params = searchTerms.flatMap((t) => [`%${t}%`, `%${t}%`, `%${t}%`]);

      const rows = db.prepare(`
        SELECT p.*, r.shop_name, r.shop_address, r.phone as shop_phone,
               r.rating as shop_rating, r.lat as r_lat, r.lng as r_lng
        FROM products p
        JOIN retailers r ON p.retailer_id = r.id
        WHERE p.availability = 1 AND (${whereClause})
      `).all(...params);

      offlineStores = rows.map((p) => {
        const distance = getDistance(userLat, userLng, p.r_lat || 17.385, p.r_lng || 78.4867);
        return {
          store: p.shop_name || 'Local Store',
          title: p.name,
          price: p.price,
          originalPrice: p.mrp,
          link: null,
          image: p.image || '',
          rating: p.shop_rating || 4.0,
          source: 'offline',
          discount: p.discount,
          stock: p.stock,
          shopAddress: p.shop_address || '',
          shopPhone: p.shop_phone || '',
          distance: Math.round(distance * 10) / 10,
          productId: p.id,
          retailerId: p.retailer_id,
        };
      });

      // Sort offline by price
      offlineStores.sort((a, b) => a.price - b.price);
    }

    // ── Step 4: Determine best price across all results ────────────────────
    const allPrices = [
      ...onlineStores.map((s) => ({ ...s, storeType: 'online' })),
      ...offlineStores.map((s) => ({ ...s, storeType: 'offline' })),
    ].filter((s) => s.price && s.price > 0);

    allPrices.sort((a, b) => a.price - b.price);

    const bestPrice = allPrices.length > 0
      ? {
          store: allPrices[0].store,
          title: allPrices[0].title,
          price: allPrices[0].price,
          storeType: allPrices[0].storeType,
          link: allPrices[0].link,
          image: allPrices[0].image,
          distance: allPrices[0].distance || null,
        }
      : null;

    // ── Step 5: Return combined response ───────────────────────────────────
    res.json({
      product: productName,
      isUrl,
      platform,
      resolvedUrl,
      onlineStores,
      offlineStores,
      bestPrice,
      totalStores: onlineStores.length + offlineStores.length,
    });
  } catch (err) {
    console.error('[compare-product] Error:', err);
    res.status(500).json({ message: 'Server error during price comparison', error: err.message });
  }
});

module.exports = router;
