const axios = require('axios');

const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY;

/**
 * Fetch Amazon product search results via Rainforest API.
 * Returns normalised product objects.
 */
async function fetchAmazonProducts(query) {
  if (!RAINFOREST_API_KEY) {
    console.warn('[Rainforest] No API key configured — skipping');
    return [];
  }

  try {
    const { data } = await axios.get('https://api.rainforestapi.com/request', {
      params: {
        api_key: RAINFOREST_API_KEY,
        type: 'search',
        amazon_domain: 'amazon.in',
        search_term: query,
      },
      timeout: 20000,
    });

    const results = data.search_results || [];

    return results.slice(0, 10).map((item) => ({
      store: 'Amazon',
      title: item.title || query,
      price: parsePrice(item.price?.value),
      originalPrice: parsePrice(item.price?.before_price?.value) || parsePrice(item.price?.value),
      link: item.link || '#',
      image: item.image || '',
      rating: item.rating || null,
      seller: item.seller?.name || 'Amazon',
      source: 'online',
      apiSource: 'rainforest',
    }));
  } catch (err) {
    console.error('[Rainforest] Error:', err.message);
    return [];
  }
}

function parsePrice(val) {
  if (!val) return null;
  if (typeof val === 'number') return val;
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : num;
}

module.exports = { fetchAmazonProducts };
