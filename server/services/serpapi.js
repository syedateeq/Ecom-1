const axios = require('axios');

const SERPAPI_KEY = process.env.SERPAPI_KEY;

/**
 * Fetch Google Shopping results for a product query.
 * Returns normalised product objects.
 */
async function fetchGoogleShopping(query) {
  if (!SERPAPI_KEY) {
    console.warn('[SerpAPI] No API key configured — skipping');
    return [];
  }

  try {
    const { data } = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_shopping',
        q: query,
        api_key: SERPAPI_KEY,
        gl: 'in',          // India results
        hl: 'en',
        num: 10,
      },
      timeout: 15000,
    });

    const results = data.shopping_results || [];

    return results.map((item) => ({
      store: item.source || 'Unknown Store',
      title: item.title || query,
      price: parsePrice(item.extracted_price || item.price),
      originalPrice: parsePrice(item.old_price) || parsePrice(item.extracted_price || item.price),
      link: item.link || '#',
      image: item.thumbnail || '',
      rating: item.rating || null,
      source: 'online',
      apiSource: 'serpapi',
    }));
  } catch (err) {
    console.error('[SerpAPI] Error:', err.message);
    return [];
  }
}

/** Extract numeric price from strings like "₹72,999" or 72999 */
function parsePrice(val) {
  if (!val) return null;
  if (typeof val === 'number') return val;
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : num;
}

module.exports = { fetchGoogleShopping };
