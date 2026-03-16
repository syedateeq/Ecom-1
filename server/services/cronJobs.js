const cron = require('node-cron');
const db = require('../db');
const { fetchGoogleShopping } = require('./serpapi');
const { fetchAmazonProducts } = require('./rainforest');
const { normalizeAndMerge } = require('./normalizer');

/**
 * Refresh online prices for tracked products every 30 minutes.
 * Takes the distinct product names from the online_prices table,
 * fetches fresh data from SerpAPI + Rainforest, and upserts results.
 */
function startPriceRefreshJob() {
  console.log('⏰ Price refresh cron job scheduled (every 30 minutes)');

  cron.schedule('*/30 * * * *', async () => {
    console.log('[cron] Starting scheduled price refresh...');
    try {
      // Get unique product names we're already tracking
      const tracked = db.prepare(
        'SELECT DISTINCT product_name FROM online_prices'
      ).all();

      if (tracked.length === 0) {
        console.log('[cron] No tracked products — skipping');
        return;
      }

      for (const { product_name } of tracked) {
        try {
          console.log(`[cron] Refreshing prices for: ${product_name}`);

          const [serpResults, rainforestResults] = await Promise.allSettled([
            fetchGoogleShopping(product_name),
            fetchAmazonProducts(product_name),
          ]).then((results) =>
            results.map((r) => (r.status === 'fulfilled' ? r.value : []))
          );

          const merged = normalizeAndMerge(serpResults, rainforestResults, []);

          if (merged.length === 0) continue;

          // Delete old entries for this product and re-insert
          db.prepare('DELETE FROM online_prices WHERE product_name LIKE ?')
            .run(`%${product_name}%`);

          const insert = db.prepare(
            'INSERT INTO online_prices (product_name, platform, price, original_price, url, rating, delivery_days, image, in_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)'
          );

          const insertMany = db.transaction((items) => {
            for (const item of items) {
              insert.run(
                item.title || product_name,
                item.store,
                item.price,
                item.originalPrice || item.price,
                item.link || '#',
                item.rating || 4.0,
                3, // default delivery days
                item.image || ''
              );
            }
          });

          insertMany(merged.slice(0, 10)); // Keep top 10 per product
          console.log(`[cron] Updated ${merged.length} prices for: ${product_name}`);
        } catch (innerErr) {
          console.error(`[cron] Error refreshing ${product_name}:`, innerErr.message);
        }
      }

      console.log('[cron] Price refresh complete');
    } catch (err) {
      console.error('[cron] Scheduled refresh failed:', err.message);
    }
  });
}

module.exports = { startPriceRefreshJob };
