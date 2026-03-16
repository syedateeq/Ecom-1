const axios = require('axios');

const PRICEAPI_KEY = process.env.PRICEAPI_KEY;
const PRICEAPI_BASE = 'https://api.priceapi.com/v2';

/**
 * Fetch marketplace price data via PriceAPI.
 *
 * PriceAPI works asynchronously:
 *   1. Create a job (POST /jobs)
 *   2. Poll until the job finishes
 *   3. Download results
 *
 * Because this can be slow, we set a short timeout and
 * return an empty array if it doesn't complete in time.
 */
async function fetchPriceApiProducts(query) {
  if (!PRICEAPI_KEY) {
    console.warn('[PriceAPI] No API key configured — skipping');
    return [];
  }

  try {
    // Step 1 — Create a search job
    const createRes = await axios.post(
      `${PRICEAPI_BASE}/jobs`,
      {
        token: PRICEAPI_KEY,
        source: 'google_shopping',
        country: 'in',
        topic: 'search_results',
        key: 'search',
        values: query,
        max_pages: 1,
      },
      { timeout: 10000 }
    );

    const jobId = createRes.data?.job_id;
    if (!jobId) return [];

    // Step 2 — Poll for completion (max 30s, check every 3s)
    let finished = false;
    for (let i = 0; i < 10; i++) {
      await sleep(3000);
      const status = await axios.get(`${PRICEAPI_BASE}/jobs/${jobId}`, {
        params: { token: PRICEAPI_KEY },
        timeout: 5000,
      });
      if (status.data?.status === 'finished') {
        finished = true;
        break;
      }
    }

    if (!finished) {
      console.warn('[PriceAPI] Job timed out');
      return [];
    }

    // Step 3 — Download results
    const resultsRes = await axios.get(
      `${PRICEAPI_BASE}/jobs/${jobId}/download`,
      {
        params: { token: PRICEAPI_KEY },
        timeout: 10000,
      }
    );

    const results = resultsRes.data?.results || [];

    return results.slice(0, 10).map((item) => {
      const content = item.content || {};
      return {
        store: content.source || content.merchant || 'Marketplace',
        title: content.name || content.title || query,
        price: parsePrice(content.price || content.min_price),
        originalPrice: parsePrice(content.old_price || content.price),
        link: content.url || '#',
        image: content.image_url || content.image || '',
        brand: content.brand || '',
        source: 'online',
        apiSource: 'priceapi',
      };
    });
  } catch (err) {
    console.error('[PriceAPI] Error:', err.message);
    return [];
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parsePrice(val) {
  if (!val) return null;
  if (typeof val === 'number') return val;
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : num;
}

module.exports = { fetchPriceApiProducts };
