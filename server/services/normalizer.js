/**
 * Merge and normalise results from all API sources into a unified format.
 * De-duplicates by store+title (keeping the cheaper entry) and sorts by price.
 */
function normalizeAndMerge(serpResults = [], rainforestResults = [], priceResults = []) {
  const all = [...serpResults, ...rainforestResults, ...priceResults]
    // Drop entries without a valid price
    .filter((item) => item.price && item.price > 0)
    // Ensure consistent shape
    .map((item) => ({
      store: item.store || 'Unknown',
      title: item.title || '',
      price: item.price,
      originalPrice: item.originalPrice || item.price,
      link: item.link || '#',
      image: item.image || '',
      rating: item.rating || null,
      source: 'online',
      apiSource: item.apiSource || 'unknown',
    }));

  // De-duplicate: for same store+title keep the one with lower price
  const seen = new Map();
  for (const item of all) {
    const key = `${item.store.toLowerCase()}::${item.title.toLowerCase().slice(0, 60)}`;
    const existing = seen.get(key);
    if (!existing || item.price < existing.price) {
      seen.set(key, item);
    }
  }

  const unique = [...seen.values()];

  // Sort by price ascending
  unique.sort((a, b) => a.price - b.price);

  return unique;
}

module.exports = { normalizeAndMerge };
