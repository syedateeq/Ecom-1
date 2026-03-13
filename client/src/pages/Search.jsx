import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import ProductCard from '../components/ProductCard';
import { HiSearch, HiFilter, HiSortDescending, HiX, HiShoppingBag } from 'react-icons/hi';

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState('');
  const [budget, setBudget] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Search when query changes from URL
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      doSearch(q);
    }
  }, [searchParams]);

  const doSearch = async (q) => {
    setLoading(true);
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
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
            placeholder="Search products..."
            className="flex-1 bg-transparent border-none outline-none px-4 py-4 text-text placeholder:text-muted"
          />
          <button type="submit" className="btn-primary !rounded-xl mr-2 !py-2.5 !px-6">
            Search
          </button>
        </div>
      </form>

      {/* Filters Row */}
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

        <button onClick={() => doSearch(query)} className="btn-secondary text-xs !py-2 !px-4 ml-auto">
          Apply Filters
        </button>
      </div>

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
          <p className="text-muted mt-4">Searching across platforms & nearby shops...</p>
        </div>
      )}

      {/* No Results */}
      {results && !loading && filteredOnline.length === 0 && filteredOffline.length === 0 && (
        <div className="text-center py-20">
          <HiShoppingBag className="text-6xl text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text mb-2">No products found</h3>
          <p className="text-muted">Try searching for "iPhone 15", "laptop", or "headphones"</p>
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
