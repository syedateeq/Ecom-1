const express = require('express');
const router = express.Router();
const axios = require('axios');
const db = require('../db');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// ─── Haversine distance (km) ────────────────────────────────────────────────
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

// ─── Keyword → Shop Category Mapping ────────────────────────────────────────
// When a user searches for a product like "iphone", Google Places should
// search for "mobile shop" or "cell phone store", not "iphone".
const KEYWORD_TO_SHOP_CATEGORY = {
  // Mobile / Phones
  iphone: 'mobile phone shop',
  samsung: 'mobile phone shop',
  oneplus: 'mobile phone shop',
  pixel: 'mobile phone shop',
  redmi: 'mobile phone shop',
  realme: 'mobile phone shop',
  vivo: 'mobile phone shop',
  oppo: 'mobile phone shop',
  mobile: 'mobile phone shop',
  phone: 'mobile phone shop',
  smartphone: 'mobile phone shop',
  // Electronics
  laptop: 'electronics store',
  computer: 'computer store',
  tablet: 'electronics store',
  headphone: 'electronics store',
  headset: 'electronics store',
  earphone: 'electronics store',
  earbuds: 'electronics store',
  speaker: 'electronics store',
  tv: 'electronics store',
  television: 'electronics store',
  camera: 'camera store',
  // Clothing
  shoes: 'shoe store',
  sneakers: 'shoe store',
  nike: 'shoe store',
  adidas: 'shoe store',
  puma: 'shoe store',
  clothing: 'clothing store',
  shirt: 'clothing store',
  jeans: 'clothing store',
  jacket: 'clothing store',
  // Home / Kitchen
  furniture: 'furniture store',
  kitchen: 'kitchen appliance store',
  appliance: 'home appliance store',
  // Books
  book: 'book store',
  // General
  grocery: 'grocery store',
  medicine: 'pharmacy',
  watch: 'watch store',
};

/**
 * Convert a product search query to a shop category keyword for Google Places.
 * e.g. "iPhone 15 Pro Max" → "mobile phone shop"
 *      "boAt headphones"   → "electronics store"
 *      "unknown gadget"    → "unknown gadget shop"
 */
function getShopKeyword(query) {
  if (!query) return 'shop';
  const words = query.toLowerCase().split(/\s+/);
  for (const word of words) {
    if (KEYWORD_TO_SHOP_CATEGORY[word]) {
      return KEYWORD_TO_SHOP_CATEGORY[word];
    }
  }
  // Fallback: use first meaningful word + "shop"
  const meaningful = words.filter(w => w.length > 2);
  return meaningful.length > 0 ? `${meaningful[0]} shop` : 'shop';
}

/**
 * GET /api/discover/nearby
 *
 * Query params:
 *   lat      — user latitude  (required)
 *   lng      — user longitude (required)
 *   keyword  — product/shop keyword (required)
 *   radius   — search radius in metres (default 5000)
 */
router.get('/nearby', async (req, res) => {
  try {
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    const rawKeyword = (req.query.keyword || '').trim();
    const radius = parseInt(req.query.radius) || 5000;

    if (!rawKeyword) {
      return res.status(400).json({ message: 'keyword is required' });
    }
    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ message: 'lat and lng are required' });
    }

    // Map product keyword to shop category for Google Places
    const shopKeyword = getShopKeyword(rawKeyword);

    console.log(`[discover/nearby] User Location: ${userLat}, ${userLng}`);
    console.log(`[discover/nearby] Raw keyword: "${rawKeyword}" → Shop keyword: "${shopKeyword}"`);

    // ── Step 1: Call Google Places Nearby Search ──────────────────────────
    let googlePlaces = [];
    try {
      const googleUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
      const { data } = await axios.get(googleUrl, {
        params: {
          location: `${userLat},${userLng}`,
          radius,
          keyword: shopKeyword,
          key: GOOGLE_MAPS_API_KEY,
        },
        timeout: 8000,
      });

      console.log(`[discover/nearby] Google API status: ${data.status}, results: ${(data.results || []).length}`);

      if (data.status === 'OK' && data.results) {
        googlePlaces = data.results.map((place) => {
          const dist = getDistance(userLat, userLng, place.geometry?.location?.lat, place.geometry?.location?.lng);
          return {
            placeId: place.place_id,
            name: place.name,
            address: place.vicinity || place.formatted_address || '',
            lat: place.geometry?.location?.lat,
            lng: place.geometry?.location?.lng,
            rating: place.rating || 0,
            userRatingsTotal: place.user_ratings_total || 0,
            openNow: place.opening_hours?.open_now ?? null,
            types: place.types || [],
            icon: place.icon || '',
            distance: Math.round(dist * 10) / 10,
            distanceText: `${(Math.round(dist * 10) / 10).toFixed(1)} km`,
            source: 'google',
          };
        });
        // Sort by distance
        googlePlaces.sort((a, b) => a.distance - b.distance);
      } else if (data.status !== 'ZERO_RESULTS') {
        console.error(`[discover/nearby] Google API error status: ${data.status}`, data.error_message);
      }
    } catch (err) {
      console.error('[discover/nearby] Google Places API error:', err.message);
    }

    // ── Step 2: Also fetch matching DB retailers ─────────────────────────
    const retailers = db
      .prepare(
        'SELECT id, name, shop_name, shop_address, phone, whatsapp, timings, category, rating, lat, lng FROM retailers'
      )
      .all();

    const nearbyDbRetailers = retailers
      .map((r) => {
        const dist = getDistance(userLat, userLng, r.lat || 17.385, r.lng || 78.4867);
        return { ...r, distance: Math.round(dist * 10) / 10 };
      })
      .filter((r) => r.distance <= radius / 1000)
      .sort((a, b) => a.distance - b.distance);

    // Search products matching keyword for nearby DB retailers
    const searchTerms = rawKeyword.split(/\s+/).filter((w) => w.length > 1).slice(0, 6);
    let dbShops = [];

    if (searchTerms.length > 0 && nearbyDbRetailers.length > 0) {
      const retailerIds = nearbyDbRetailers.map((r) => r.id);
      const placeholders = retailerIds.map(() => '?').join(',');
      const whereLike = searchTerms
        .map(() => 'p.name LIKE ? OR p.category LIKE ? OR p.description LIKE ?')
        .join(' OR ');

      const productRows = db
        .prepare(
          `SELECT p.*, r.shop_name, r.shop_address, r.phone, r.whatsapp, r.timings,
                  r.category as shop_category, r.rating as shop_rating, r.lat as r_lat, r.lng as r_lng
           FROM products p
           JOIN retailers r ON p.retailer_id = r.id
           WHERE p.availability = 1
             AND p.retailer_id IN (${placeholders})
             AND (${whereLike})`
        )
        .all(
          ...retailerIds,
          ...searchTerms.flatMap((t) => [`%${t}%`, `%${t}%`, `%${t}%`])
        );

      // Group by retailer
      const byRetailer = {};
      for (const p of productRows) {
        if (!byRetailer[p.retailer_id]) {
          const dist = getDistance(userLat, userLng, p.r_lat || 17.385, p.r_lng || 78.4867);
          byRetailer[p.retailer_id] = {
            name: p.shop_name,
            address: p.shop_address,
            phone: p.phone,
            lat: p.r_lat,
            lng: p.r_lng,
            rating: p.shop_rating,
            category: p.shop_category,
            timings: p.timings,
            distance: Math.round(dist * 10) / 10,
            distanceText: `${(Math.round(dist * 10) / 10).toFixed(1)} km`,
            retailerId: p.retailer_id,
            source: 'database',
            products: [],
          };
        }
        byRetailer[p.retailer_id].products.push({
          id: p.id,
          name: p.name,
          price: p.price,
          mrp: p.mrp,
          discount: p.discount,
          stock: p.stock,
          image: p.image,
        });
      }
      dbShops = Object.values(byRetailer);
      dbShops.sort((a, b) => a.distance - b.distance);
    }

    console.log(`[discover/nearby] Google Places: ${googlePlaces.length}, DB shops: ${dbShops.length}`);

    // ── Step 3: Return combined results ──────────────────────────────────
    res.json({
      userLocation: { lat: userLat, lng: userLng },
      keyword: rawKeyword,
      shopKeyword,
      radius,
      googleShops: googlePlaces,
      dbShops,
      totalResults: googlePlaces.length + dbShops.length,
    });
  } catch (err) {
    console.error('[discover/nearby] Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
