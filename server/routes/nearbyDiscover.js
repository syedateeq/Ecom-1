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

// ─── Name similarity check (fuzzy) ─────────────────────────────────────────
function nameSimilarity(a, b) {
  if (!a || !b) return 0;
  const normalize = (s) =>
    s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  const wordsA = normalize(a).split(/\s+/);
  const wordsB = normalize(b).split(/\s+/);
  const matches = wordsA.filter((w) => wordsB.some((wb) => wb.includes(w) || w.includes(wb)));
  return matches.length / Math.max(wordsA.length, wordsB.length);
}

/**
 * GET /api/discover/nearby
 *
 * Query params:
 *   lat      — user latitude  (required)
 *   lng      — user longitude (required)
 *   keyword  — product/shop keyword (required)
 *   radius   — search radius in metres (default 5000)
 *
 * Workflow:
 *   1. Call Google Places Nearby Search with keyword
 *   2. Match Google results with SQLite retailers (name or proximity)
 *   3. For matched retailers, find products matching the keyword
 *   4. Calculate distance, sort by distance then price
 *   5. Return merged result list
 */
router.get('/nearby', async (req, res) => {
  try {
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    const keyword = (req.query.keyword || '').trim();
    const radius = parseInt(req.query.radius) || 5000;

    if (!keyword) {
      return res.status(400).json({ message: 'keyword is required' });
    }
    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ message: 'lat and lng are required' });
    }

    // ── Step 1: Call Google Places Nearby Search ──────────────────────────
    let googlePlaces = [];
    try {
      const googleUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
      const { data } = await axios.get(googleUrl, {
        params: {
          location: `${userLat},${userLng}`,
          radius,
          keyword: `${keyword} shop`,
          key: GOOGLE_MAPS_API_KEY,
        },
        timeout: 8000,
      });

      if (data.status === 'OK' && data.results) {
        googlePlaces = data.results.map((place) => ({
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
        }));
      }
    } catch (err) {
      console.error('[discover/nearby] Google Places API error:', err.message);
      // Continue — we'll still return DB results even if Google fails
    }

    // ── Step 2: Fetch all retailers from DB ──────────────────────────────
    const retailers = db
      .prepare(
        'SELECT id, name, shop_name, shop_address, phone, whatsapp, timings, category, rating, lat, lng FROM retailers'
      )
      .all();

    // ── Step 3: Match Google Places with DB retailers ────────────────────
    // A "match" = name similarity ≥ 0.4 OR location within 200m
    const PROXIMITY_THRESHOLD_KM = 0.2; // 200 metres
    const NAME_SIMILARITY_THRESHOLD = 0.4;

    const matchedRetailerIds = new Set();
    const googleMatches = []; // Google places that matched a DB retailer

    for (const gPlace of googlePlaces) {
      let bestMatch = null;
      let bestScore = 0;

      for (const retailer of retailers) {
        const dist = getDistance(
          gPlace.lat, gPlace.lng,
          retailer.lat || 17.385, retailer.lng || 78.4867
        );
        const nameScore = Math.max(
          nameSimilarity(gPlace.name, retailer.shop_name),
          nameSimilarity(gPlace.name, retailer.name)
        );

        const score = dist <= PROXIMITY_THRESHOLD_KM ? nameScore + 0.5 : nameScore;
        if (score > bestScore && (nameScore >= NAME_SIMILARITY_THRESHOLD || dist <= PROXIMITY_THRESHOLD_KM)) {
          bestScore = score;
          bestMatch = retailer;
        }
      }

      if (bestMatch) {
        matchedRetailerIds.add(bestMatch.id);
        googleMatches.push({ googlePlace: gPlace, retailer: bestMatch });
      }
    }

    // ── Step 4: Search products by keyword in matched + nearby retailers ─
    // Also include DB retailers within radius that weren't matched by Google
    const nearbyDbRetailers = retailers.filter((r) => {
      const dist = getDistance(userLat, userLng, r.lat || 17.385, r.lng || 78.4867);
      return dist <= radius / 1000; // convert metres to km
    });

    for (const r of nearbyDbRetailers) {
      matchedRetailerIds.add(r.id);
    }

    const retailerIds = [...matchedRetailerIds];
    if (retailerIds.length === 0) {
      return res.json({
        userLocation: { lat: userLat, lng: userLng },
        keyword,
        radius,
        totalShops: 0,
        shops: [],
        googlePlacesCount: googlePlaces.length,
      });
    }

    // Search products matching keyword for these retailers
    const searchTerms = keyword.split(/\s+/).filter((w) => w.length > 1).slice(0, 6);
    let productRows = [];

    if (searchTerms.length > 0) {
      const whereLike = searchTerms
        .map(() => 'p.name LIKE ? OR p.category LIKE ? OR p.description LIKE ?')
        .join(' OR ');
      const placeholders = retailerIds.map(() => '?').join(',');

      productRows = db
        .prepare(
          `SELECT p.*, r.shop_name, r.shop_address, r.phone, r.whatsapp, r.timings, r.category as shop_category,
                  r.rating as shop_rating, r.lat as r_lat, r.lng as r_lng, r.name as owner_name
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
    }

    // ── Step 5: Build shop results with distance and product info ────────
    // Group products by retailer
    const productsByRetailer = {};
    for (const p of productRows) {
      if (!productsByRetailer[p.retailer_id]) {
        productsByRetailer[p.retailer_id] = {
          retailer: {
            id: p.retailer_id,
            ownerName: p.owner_name,
            shopName: p.shop_name,
            shopAddress: p.shop_address,
            phone: p.phone,
            whatsapp: p.whatsapp,
            timings: p.timings,
            category: p.shop_category,
            rating: p.shop_rating,
            lat: p.r_lat,
            lng: p.r_lng,
          },
          products: [],
        };
      }
      productsByRetailer[p.retailer_id].products.push({
        id: p.id,
        name: p.name,
        price: p.price,
        mrp: p.mrp,
        discount: p.discount,
        stock: p.stock,
        image: p.image,
        category: p.category,
      });
    }

    // Also include retailers without matching products (from Google Places) for map display
    for (const r of nearbyDbRetailers) {
      if (!productsByRetailer[r.id]) {
        // Check if this retailer has ANY products matching keyword
        // Already checked above, so skip if no products
      }
    }

    // Build final shop list
    const shops = Object.values(productsByRetailer).map((entry) => {
      const r = entry.retailer;
      const products = entry.products;
      const dist = getDistance(userLat, userLng, r.lat || 17.385, r.lng || 78.4867);

      // Find if this retailer was matched by a Google Place
      const googleMatch = googleMatches.find((gm) => gm.retailer.id === r.id);

      // Sort products by price (lowest first)
      products.sort((a, b) => a.price - b.price);
      const cheapestProduct = products[0];

      return {
        shopName: r.shopName,
        shopAddress: r.shopAddress,
        phone: r.phone,
        whatsapp: r.whatsapp,
        timings: r.timings,
        category: r.category,
        rating: r.rating,
        lat: r.lat,
        lng: r.lng,
        distance: Math.round(dist * 10) / 10,
        distanceText: `${(Math.round(dist * 10) / 10).toFixed(1)} km`,
        retailerId: r.id,
        totalProducts: products.length,
        inStockCount: products.filter((p) => p.stock > 0).length,
        cheapestPrice: cheapestProduct ? cheapestProduct.price : null,
        products: products.slice(0, 5),
        // Google Places metadata (if matched)
        googlePlace: googleMatch
          ? {
              placeId: googleMatch.googlePlace.placeId,
              googleName: googleMatch.googlePlace.name,
              googleRating: googleMatch.googlePlace.rating,
              googleReviews: googleMatch.googlePlace.userRatingsTotal,
              openNow: googleMatch.googlePlace.openNow,
            }
          : null,
        // badges
        nearestAndCheapest: false, // set below
      };
    });

    // Sort by distance first, then by cheapest price
    shops.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return (a.cheapestPrice || Infinity) - (b.cheapestPrice || Infinity);
    });

    // Mark "Nearest & Cheapest" — the shop with lowest price among the top 3 nearest
    if (shops.length > 0) {
      const topNearest = shops.slice(0, Math.min(3, shops.length));
      const withProducts = topNearest.filter((s) => s.cheapestPrice !== null);
      if (withProducts.length > 0) {
        const best = withProducts.reduce((min, s) =>
          s.cheapestPrice < min.cheapestPrice ? s : min
        );
        const idx = shops.findIndex((s) => s.retailerId === best.retailerId);
        if (idx !== -1) shops[idx].nearestAndCheapest = true;
      }
    }

    // ── Step 6: Also return unmatched Google Places for map display ──────
    const unmatchedGooglePlaces = googlePlaces
      .filter((gp) => !googleMatches.some((gm) => gm.googlePlace.placeId === gp.placeId))
      .map((gp) => ({
        shopName: gp.name,
        shopAddress: gp.address,
        lat: gp.lat,
        lng: gp.lng,
        rating: gp.rating,
        googleReviews: gp.userRatingsTotal,
        openNow: gp.openNow,
        distance: Math.round(getDistance(userLat, userLng, gp.lat, gp.lng) * 10) / 10,
        distanceText: `${(Math.round(getDistance(userLat, userLng, gp.lat, gp.lng) * 10) / 10).toFixed(1)} km`,
        isGoogleOnly: true,
        placeId: gp.placeId,
        totalProducts: 0,
        inStockCount: 0,
        products: [],
      }));

    res.json({
      userLocation: { lat: userLat, lng: userLng },
      keyword,
      radius,
      totalShops: shops.length,
      shops,
      googlePlaces: unmatchedGooglePlaces,
      googlePlacesCount: googlePlaces.length,
    });
  } catch (err) {
    console.error('[discover/nearby] Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
