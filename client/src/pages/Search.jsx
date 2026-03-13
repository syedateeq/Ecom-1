import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import ProductCard from '../components/ProductCard';
import { HiSearch, HiFilter, HiSortDescending, HiX, HiShoppingBag, HiExternalLink, HiLink } from 'react-icons/hi';

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || searchParams.get('url') || '');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState('');
  const [budget, setBudget] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // URL search metadata
  const [urlMeta, setUrlMeta] = useState(null); // { extractedTitle, sourcePlatform, sourceUrl, wasShortLink }
  const [urlError, setUrlError] = useState('');
  const [isShortLinkError, setIsShortLinkError] = useState(false);

  // Short-link domains (for loading message only)
  const SHORT_LINK_DOMAINS = ['amzn.in', 'amzn.to', 'fkrt.cc', 'fkrt.it', 'bit.ly', 'tinyurl.com', 'rb.gy', 't.co', 'ow.ly', 'goo.gl'];
  const isShortUrl = (str) => {
    try { return SHORT_LINK_DOMAINS.some(d => new URL(str).hostname.replace(/^www\./, '') === d); }
    catch { return false; }
  };

  // Helper: detect if input is a URL
  const isUrl = (str) => str.startsWith('http://') || str.startsWith('https://');

  // Search when query changes from URL
  useEffect(() => {
    const q = searchParams.get('q');
    const url = searchParams.get('url');
    if (url) {
      setQuery(url);
      doUrlSearch(url);
    } else if (q) {
      setQuery(q);
      setUrlMeta(null);
      setUrlError('');
      doSearch(q);
    }
  }, [searchParams]);

  const doSearch = async (q) => {
    setLoading(true);
    setUrlError('');
    try {
      const params = new URLSearchParams({ q });
      if (sort) params.append('sort', sort);
      if (budget) params.append('budget', budget);
      const { data } = await API.get(`/products/search?${params}`);
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const doUrlSearch = async (url) => {
    setLoading(true);
    setUrlError('');
    setIsShortLinkError(false);
    setUrlMeta(null);
    setResults(null);
    try {
      const { data } = await API.post('/products/url-search', { url });
      setUrlMeta({
        extractedTitle: data.extractedTitle,
        sourcePlatform: data.sourcePlatform,
        sourceUrl: data.sourceUrl,
        wasShortLink: data.wasShortLink,
      });
      setResults(data);
    } catch (err) {
      console.error('URL search error:', err);
      const message = err.response?.data?.message || 'Unable to extract product details from this link.';
      setUrlError(message);
      setIsShortLinkError(!!err.response?.data?.isShortLink);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    if (isUrl(trimmed)) {
      navigate(`/search?url=${encodeURIComponent(trimmed)}`);
    } else {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const filteredOnline = results?.onlinePrices || [];
  const filteredOffline = results?.offlineProducts || [];
  const recommendations = results?.recommendations || {};

  // Map recommendation labels to products
  const getRecommendation = (product, type) => {
    if (type === 'online' && recommendations.cheapestOnline?.price === product.price && recommendations.cheapestOnline?.platform === product.platform) {
      return 'Cheapest Online';
    }
    if (type === 'offline' && recommendations.bestNearbyShop?._id === product._id) {
      return 'Best Nearby Shop';
    }
    return null;
  };

  // Platform badge colors
  const platformColors = {
    Amazon: { bg: 'rgba(255,153,0,0.12)', border: 'rgba(255,153,0,0.3)', text: '#FF9900' },
    Flipkart: { bg: 'rgba(47,128,237,0.12)', border: 'rgba(47,128,237,0.3)', text: '#2F80ED' },
  };

  return (
    <div className="min-h-screen py-8 px-4 max-w-7xl mx-auto">
      {/* Search Header */}
      <form onSubmit={handleSearch} className="mb-8 animate-fade-in-up">
        <div className="flex items-center glass-card !rounded-2xl overflow-hidden">
          <HiSearch className="text-xl text-muted ml-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product name or paste Amazon / Flipkart link…"
            className="flex-1 bg-transparent border-none outline-none px-4 py-4 text-text placeholder:text-muted"
          />
          <button type="submit" className="btn-primary !rounded-xl mr-2 !py-2.5 !px-6">
            Search
          </button>
        </div>
      </form>

      {/* URL Search Banner */}
      {urlMeta && !loading && (
        <div className="glass-card p-4 mb-6 animate-fade-in-up" style={{ borderColor: platformColors[urlMeta.sourcePlatform]?.border || 'rgba(108,60,225,0.3)' }}>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <HiLink className="text-lg" style={{ color: platformColors[urlMeta.sourcePlatform]?.text || '#8B5CF6' }} />
              <span
                className="px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: platformColors[urlMeta.sourcePlatform]?.bg,
                  color: platformColors[urlMeta.sourcePlatform]?.text,
                  border: `1px solid ${platformColors[urlMeta.sourcePlatform]?.border}`,
                }}
              >
                {urlMeta.sourcePlatform}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text">
                Showing results for: <span className="font-semibold text-primary-light">"{urlMeta.extractedTitle}"</span>
              </p>
            </div>
            <a
              href={urlMeta.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted hover:text-primary-light flex items-center gap-1 transition-colors flex-shrink-0"
            >
              <HiExternalLink /> View original
            </a>
          </div>
        </div>
      )}

      {/* URL Error */}
      {urlError && !loading && (
        <div className="glass-card p-5 mb-6 animate-fade-in-up" style={{ borderColor: 'rgba(255,77,106,0.3)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,77,106,0.15)' }}>
              <HiX className="text-danger text-lg" />
            </div>
            <div>
              <p className="text-danger text-sm font-medium">{urlError}</p>
              <p className="text-xs text-muted mt-1">
                {isShortLinkError
                  ? 'Open the short link in your browser, copy the full URL from the address bar, and paste it here.'
                  : 'Try pasting a direct product page URL from Amazon or Flipkart, or search by product name instead.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters Row */}
      {!urlError && (
        <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-2">
            <HiFilter className="text-muted" />
            <span className="text-sm text-muted">Budget:</span>
            <input
              type="number"
              value={budget}
              onChange={e => { setBudget(e.target.value); }}
              placeholder="Max ₹"
              className="input-field !w-32 !py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <HiSortDescending className="text-muted" />
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="input-field !w-36 !py-2 text-sm cursor-pointer">
              <option value="">Sort By</option>
              <option value="price">Price: Low to High</option>
              <option value="rating">Rating</option>
              <option value="distance">Distance</option>
            </select>
          </div>

          {(budget || sort) && (
            <button onClick={() => { setBudget(''); setSort(''); }} className="text-xs text-danger flex items-center gap-1 hover:underline">
              <HiX /> Clear
            </button>
          )}

          <button onClick={() => {
            const q = searchParams.get('q');
            if (q) doSearch(q);
          }} className="btn-secondary text-xs !py-2 !px-4 ml-auto">
            Apply Filters
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-card rounded-xl p-1 w-fit">
        {[
          { key: 'all', label: `All (${filteredOnline.length + filteredOffline.length})` },
          { key: 'online', label: `Online (${filteredOnline.length})` },
          { key: 'offline', label: `Nearby Shops (${filteredOffline.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-primary text-white' : 'text-muted hover:text-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recommendation Banner */}
      {recommendations.bestOverallValue && (
        <div className="glass-card p-4 mb-6 flex items-center gap-3 border-gold/30 animate-fade-in-up">
          <span className="text-2xl">🏆</span>
          <div>
            <h3 className="text-sm font-semibold text-gold">Best Overall Value</h3>
            <p className="text-xs text-muted">
              {recommendations.bestOverallValue.name || recommendations.bestOverallValue.productName} at ₹{recommendations.bestOverallValue.price?.toLocaleString()}
              {recommendations.bestOverallValue.type === 'online' ? ` on ${recommendations.bestOverallValue.platform}` : ` at ${recommendations.bestOverallValue.shopName}`}
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted mt-4">
            {searchParams.get('url')
              ? isShortUrl(searchParams.get('url'))
                ? 'Resolving link and searching across platforms…'
                : 'Extracting product info and searching across platforms…'
              : 'Searching across platforms & nearby shops…'}
          </p>
        </div>
      )}

      {/* No Results */}
      {results && !loading && filteredOnline.length === 0 && filteredOffline.length === 0 && !urlError && (
        <div className="text-center py-20">
          <HiShoppingBag className="text-6xl text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text mb-2">No products found</h3>
          <p className="text-muted">
            {urlMeta
              ? `No matching products found for "${urlMeta.extractedTitle}". Try searching with a different product name.`
              : 'Try searching for "iPhone 15", "laptop", or "headphones"'}
          </p>
        </div>
      )}

      {/* Results Grid */}
      {!loading && results && (
        <div className="space-y-8">
          {/* Online Prices */}
          {(activeTab === 'all' || activeTab === 'online') && filteredOnline.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                🌐 Online Prices <span className="text-sm text-muted font-normal">({filteredOnline.length} results)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredOnline.map((product, i) => (
                  <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                    <ProductCard product={product} type="online" recommendation={getRecommendation(product, 'online')} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offline / Nearby Shops */}
          {(activeTab === 'all' || activeTab === 'offline') && filteredOffline.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                🏪 Nearby Shops <span className="text-sm text-muted font-normal">({filteredOffline.length} results)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredOffline.map((product, i) => (
                  <div key={product._id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                    <ProductCard product={product} type="offline" recommendation={getRecommendation(product, 'offline')} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
