const express = require('express');
const router = express.Router();
const db = require('../db');
const https = require('https');
const http = require('http');

// ─── URL helpers ────────────────────────────────────────────────────────────

/**
 * Resolve a potentially shortened URL by following up to 5 redirects.
 * Returns the final URL string, or the original URL if no redirect happened / error.
 */
function resolveShortUrl(url, maxRedirects = 5) {
  return new Promise((resolve) => {
    let current = url;
    let remaining = maxRedirects;

    function follow(u) {
      if (remaining <= 0) return resolve(current);
      remaining--;

      let parsedUrl;
      try { parsedUrl = new URL(u); } catch { return resolve(current); }

      const lib = parsedUrl.protocol === 'https:' ? https : http;
      const req = lib.request(
        { method: 'HEAD', hostname: parsedUrl.hostname, port: parsedUrl.port || undefined,
          path: parsedUrl.pathname + parsedUrl.search, headers: { 'User-Agent': 'Mozilla/5.0' } },
        (res) => {
          const loc = res.headers['location'];
          if (loc && (res.statusCode >= 300 && res.statusCode < 400)) {
            // Location may be relative
            current = loc.startsWith('http') ? loc : new URL(loc, u).href;
            follow(current);
          } else {
            resolve(current);
          }
        }
      );
      req.setTimeout(5000, () => { req.destroy(); resolve(current); });
      req.on('error', () => resolve(current));
      req.end();
    }

    follow(current);
  });
}

/** Known short-link / redirect domains that must be resolved before extraction */
const SHORT_DOMAINS = new Set([
  'amzn.in', 'amzn.to',
  'fkrt.cc', 'fkrt.it',
  'bit.ly', 'tinyurl.com', 'rb.gy', 't.co',
  'ow.ly', 'is.gd', 'buff.ly', 'goo.gl', 'shorturl.at',
]);

function isShortOrRedirectUrl(hostname) {
  const h = hostname.replace(/^www\./, '').toLowerCase();
  return SHORT_DOMAINS.has(h);
}

function detectPlatform(hostname) {
  const h = hostname.replace(/^(www\.|m\.|smile\.|dl\.)/, '').toLowerCase();
  if (h === 'amazon.in' || h === 'amazon.com') return 'Amazon';
  if (h === 'flipkart.com') return 'Flipkart';
  return null;
}

// Amazon: match  /optional-slug/dp/ASIN  or  /gp/product/ASIN  or  /gp/aw/d/ASIN
const AMAZON_RE = /\/(?:([^/]+)\/)?(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i;

function extractAmazonTitle(parsed) {
  const m = parsed.pathname.match(AMAZON_RE);
  if (!m) return null;

  const slug = m[1]; // e.g. "Apple-iPhone-15-128GB-Black" — may be undefined
  if (slug) {
    const titleWords = slug
      .split('-')
      .map(w => w.replace(/[_+%20]/g, ' ').trim())
      .filter(w => w.length > 0 && w !== 'dp' && w !== 'gp');
    if (titleWords.length > 0) return titleWords.join(' ');
  }
  // Fallback: use ASIN as search term (may not match DB but avoids hard failure)
  return m[2];
}

// Flipkart: /product-slug/p/ITEM_ID
const FLIPKART_RE = /\/([^/]+)\/p\/[^/?#]*/i;

function extractFlipkartTitle(parsed) {
  // Try /slug/p/id pattern
  const m = parsed.pathname.match(FLIPKART_RE);
  if (m) {
    const slug = m[1];
    if (slug && slug !== 'p') {
      const words = slug
        .split('-')
        .map(w => w.replace(/[_+%20]/g, ' ').trim())
        .filter(w => w.length > 0);
      if (words.length > 0) return words.join(' ');
    }
  }
  // Fallback: query param
  const qParam = parsed.searchParams.get('q') || parsed.searchParams.get('title');
  if (qParam) return qParam;
  return null;
}

function slugToReadable(title) {
  if (!title) return title;
  return title
    .replace(/\b(dp|gp|ref|pid|lid|marketplace|store|srno|otracker|iid|ssid|affid)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

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
        retailerId: p.retailer_id,
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

// POST /api/products/url-search — Extract product title from Amazon/Flipkart URL and search
router.post('/url-search', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    // Validate parseable URL
    let parsed;
    try {
      parsed = new URL(url);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid URL format. Please paste a valid product link.' });
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ message: 'Invalid URL format. Please paste a valid product link.' });
    }

    // ── Step 1: Resolve redirects for short / unknown URLs ──────────────────
    const needsResolve = isShortOrRedirectUrl(parsed.hostname) ||
      detectPlatform(parsed.hostname) === null; // unknown domain → try resolving
    let resolvedUrl = url;
    let wasShortLink = isShortOrRedirectUrl(parsed.hostname);

    if (needsResolve) {
      resolvedUrl = await resolveShortUrl(url);
      try { parsed = new URL(resolvedUrl); } catch { /* keep original parsed */ }
    }

    // ── Step 2: Detect platform from resolved URL ───────────────────────────
    const platform = detectPlatform(parsed.hostname);

    if (!platform) {
      // Still not a known platform after resolving
      if (wasShortLink) {
        return res.status(400).json({
          message: 'Short product links are not supported yet. Please paste the full Amazon or Flipkart product page URL.',
          isShortLink: true
        });
      }
      return res.status(400).json({
        message: 'Only Amazon and Flipkart links are currently supported.',
        supportedDomains: ['amazon.in', 'flipkart.com']
      });
    }

    // ── Step 3: Extract product title ───────────────────────────────────────
    let rawTitle = null;
    if (platform === 'Amazon') {
      rawTitle = extractAmazonTitle(parsed);
    } else {
      rawTitle = extractFlipkartTitle(parsed);
    }

    let extractedTitle = rawTitle ? slugToReadable(rawTitle) : null;

    if (!extractedTitle) {
      if (wasShortLink) {
        return res.status(400).json({
          message: 'Short product links are not supported yet. Please paste the full Amazon or Flipkart product page URL.',
          isShortLink: true
        });
      }
      return res.status(400).json({
        message: 'Unable to extract product details from this link. Please try pasting a direct product page URL.'
      });
    }

    // ── Step 4: Search DB using extracted title ──────────────────────────────
    const q = extractedTitle;
    const userLat = parseFloat(req.body.lat) || 17.385;
    const userLng = parseFloat(req.body.lng) || 78.4867;
    const maxBudget = req.body.budget ? parseFloat(req.body.budget) : Infinity;

    // Limit to 6 meaningful terms to avoid over-restriction
    const searchTerms = q.split(/\s+/).filter(w => w.length > 1).slice(0, 6);

    if (searchTerms.length === 0) {
      return res.status(400).json({ message: 'Unable to extract a searchable product name from the URL.' });
    }

    // Search online prices
    let onlinePrices = db.prepare(`
      SELECT * FROM online_prices 
      WHERE ${searchTerms.map(() => 'product_name LIKE ?').join(' OR ')}
    `).all(...searchTerms.map(t => `%${t}%`));

    if (maxBudget !== Infinity) {
      onlinePrices = onlinePrices.filter(p => p.price <= maxBudget);
    }

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

    // Search offline products
    let offlineProducts = db.prepare(`
      SELECT p.*, r.shop_name, r.shop_address, r.rating as shop_rating, r.lat as r_lat, r.lng as r_lng
      FROM products p
      JOIN retailers r ON p.retailer_id = r.id
      WHERE p.availability = 1 AND (${searchTerms.map(() => 'p.name LIKE ? OR p.category LIKE ? OR p.description LIKE ?').join(' OR ')})
    `).all(...searchTerms.flatMap(t => [`%${t}%`, `%${t}%`, `%${t}%`]));

    if (maxBudget !== Infinity) {
      offlineProducts = offlineProducts.filter(p => p.price <= maxBudget);
    }

    offlineProducts = offlineProducts.map(p => {
      const distance = getDistance(userLat, userLng, p.r_lat || 17.385, p.r_lng || 78.4867);
      return {
        _id: p.id, name: p.name, description: p.description, category: p.category,
        image: p.image, price: p.price, mrp: p.mrp, discount: p.discount,
        stock: p.stock, availability: p.availability, retailerId: p.retailer_id,
        shopName: p.shop_name || 'Unknown Shop', shopAddress: p.shop_address || '',
        shopRating: p.shop_rating || 4.0, rating: p.shop_rating || 4.0,
        distance: Math.round(distance * 10) / 10, type: 'offline'
      };
    });

    const recommendations = computeRecommendations(onlinePrices, offlineProducts);

    res.json({
      query: q,
      extractedTitle,
      sourceUrl: resolvedUrl,   // final resolved URL (not the short link)
      sourcePlatform: platform,
      wasShortLink,
      onlinePrices,
      offlineProducts,
      recommendations,
      totalResults: onlinePrices.length + offlineProducts.length
    });
  } catch (err) {
    console.error('URL search error:', err);
    res.status(500).json({ message: 'Server error while processing URL', error: err.message });
  }
});

// GET /api/products/store/:shopId/product/:productId — Visit Store detail page
router.get('/store/:shopId/product/:productId', (req, res) => {
  try {
    const { shopId, productId } = req.params;
    const userLat = parseFloat(req.query.lat) || 17.385;
    const userLng = parseFloat(req.query.lng) || 78.4867;

    // Fetch product
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND retailer_id = ?').get(productId, shopId);
    if (!product) return res.status(404).json({ message: 'Product not found in this store' });

    // Fetch full retailer/shop details
    const shop = db.prepare('SELECT * FROM retailers WHERE id = ?').get(shopId);
    if (!shop) return res.status(404).json({ message: 'Store not found' });

    // Calculate distance
    const distance = getDistance(userLat, userLng, shop.lat || 17.385, shop.lng || 78.4867);

    res.json({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        image: product.image,
        price: product.price,
        mrp: product.mrp,
        discount: product.discount,
        stock: product.stock,
        category: product.category,
        barcode: product.barcode,
        availability: product.availability
      },
      shop: {
        id: shop.id,
        shopName: shop.shop_name,
        shopkeeperName: shop.name,
        phone: shop.phone,
        whatsapp: shop.whatsapp || shop.phone,
        email: shop.email,
        shopAddress: shop.shop_address,
        lat: shop.lat,
        lng: shop.lng,
        rating: shop.rating,
        category: shop.category,
        timings: shop.timings || '9:00 AM - 9:00 PM',
        distance: Math.round(distance * 10) / 10
      }
    });
  } catch (err) {
    console.error('Store product detail error:', err);
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

// GET /api/products/nearby-shops?lat=17.385&lng=78.4867&radius=15
// Returns all shops with their products, distance, and stock summary
router.get('/nearby-shops', (req, res) => {
  try {
    const userLat = parseFloat(req.query.lat) || 17.385;
    const userLng = parseFloat(req.query.lng) || 78.4867;
    const radius = parseFloat(req.query.radius) || 15; // km

    // Fetch all retailers
    const retailers = db.prepare(
      'SELECT id, name, email, shop_name, shop_address, phone, whatsapp, timings, category, rating, lat, lng FROM retailers'
    ).all();

    // Fetch all available products grouped by retailer
    const products = db.prepare(
      'SELECT id, name, price, mrp, discount, stock, availability, category, image, retailer_id FROM products WHERE availability = 1'
    ).all();

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

    // Build shop list with distance
    const shops = retailers
      .map((r) => {
        const dist = getDistance(userLat, userLng, r.lat || 17.385, r.lng || 78.4867);
        const shopProducts = productsByRetailer[r.id] || [];
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
          priceRange: shopProducts.length > 0
            ? { min: Math.min(...shopProducts.map((p) => p.price)), max: Math.max(...shopProducts.map((p) => p.price)) }
            : null,
          products: shopProducts.slice(0, 5), // top 5 for popup preview
        };
      })
      .filter((s) => s.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      userLocation: { lat: userLat, lng: userLng },
      radius,
      totalShops: shops.length,
      shops,
    });
  } catch (err) {
    console.error('Nearby shops error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

