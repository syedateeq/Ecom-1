import { useState, useEffect, useCallback, useRef } from 'react';
import { HiLocationMarker, HiPhone, HiClock, HiStar, HiSearch, HiRefresh, HiExternalLink } from 'react-icons/hi';
import API from '../utils/api';
import { searchLocation } from '../utils/geocoding';
import MapView from '../components/MapView';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [17.385, 78.4867]; // Hyderabad

export default function NearbyShops() {
  // Google Places shops
  const [googleShops, setGoogleShops] = useState([]);
  // DB matched shops (with products)
  const [dbShops, setDbShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState(DEFAULT_CENTER);

  // Product / shop search
  const [productQuery, setProductQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [shopKeyword, setShopKeyword] = useState('');

  // Location search
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [activeShopId, setActiveShopId] = useState(null);
  const debounceRef = useRef(null);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = [pos.coords.latitude, pos.coords.longitude];
          console.log('User Location:', loc[0], loc[1]);
          setUserLocation(loc);
          setCenter(loc);
        },
        () => {
          console.log('Geolocation denied, using default:', DEFAULT_CENTER);
        },
        { timeout: 6000 }
      );
    }
  }, []);

  // Fetch nearby shops from our backend (which calls Google Places API)
  const fetchNearbyShops = useCallback(async (lat, lng, keyword) => {
    if (!keyword || keyword.trim().length === 0) return;
    setLoading(true);
    try {
      const { data } = await API.get('/discover/nearby', {
        params: { lat, lng, keyword, radius: 5000 },
      });
      console.log('API Response:', data);
      setGoogleShops(data.googleShops || []);
      setDbShops(data.dbShops || []);
      setShopKeyword(data.shopKeyword || keyword);
      setSearchedQuery(keyword);
    } catch (err) {
      console.error('Failed to fetch nearby shops:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle product search submit
  const handleProductSearch = (e) => {
    e.preventDefault();
    const q = productQuery.trim();
    if (!q) return;
    fetchNearbyShops(userLocation[0], userLocation[1], q);
  };

  // Quick-search presets
  const quickSearches = ['iPhone', 'Laptop', 'Headphones', 'Shoes', 'Clothing', 'Grocery'];

  // Location search (debounced)
  const handleLocationSearchChange = (e) => {
    const val = e.target.value;
    setLocationQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 3) {
      setLocationResults([]);
      setShowLocationDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await searchLocation(val);
      setLocationResults(results);
      setShowLocationDropdown(results.length > 0);
    }, 500);
  };

  const handleSelectLocation = (loc) => {
    setCenter([loc.lat, loc.lng]);
    setUserLocation([loc.lat, loc.lng]);
    setLocationQuery(loc.displayName.split(',').slice(0, 2).join(','));
    setShowLocationDropdown(false);
    // Re-fetch shops if a search was already done
    if (searchedQuery) {
      fetchNearbyShops(loc.lat, loc.lng, searchedQuery);
    }
  };

  // Build map markers from BOTH Google shops and DB shops
  const allShops = [
    ...googleShops.map((s, i) => ({ ...s, id: `g-${i}`, isGoogle: true })),
    ...dbShops.map((s, i) => ({ ...s, id: `db-${i}`, isGoogle: false })),
  ];

  const markers = allShops
    .filter((s) => s.lat && s.lng)
    .map((s) => ({
      id: s.id,
      lat: s.lat,
      lng: s.lng,
      name: s.name,
      popupContent: `
        <div style="font-family: Inter, system-ui, sans-serif; min-width: 200px;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #1a1a2e;">${s.name}</div>
          <div style="font-size: 12px; color: #555; margin-bottom: 6px;">📍 ${s.address || 'N/A'}</div>
          <div style="display: flex; gap: 12px; font-size: 12px; color: #444;">
            <span>📏 ${s.distanceText || s.distance + ' km'}</span>
            ${s.rating ? `<span>⭐ ${s.rating}</span>` : ''}
            ${s.userRatingsTotal ? `<span>(${s.userRatingsTotal})</span>` : ''}
          </div>
          ${s.openNow !== null && s.openNow !== undefined ? `
            <div style="margin-top: 6px; font-size: 12px; color: ${s.openNow ? '#00C853' : '#FF4D6A'}; font-weight: 600;">
              ${s.openNow ? '🟢 Open now' : '🔴 Closed'}
            </div>
          ` : ''}
          ${s.isGoogle ? '<div style="margin-top: 4px; font-size: 11px; color: #4285F4;">via Google Maps</div>' : '<div style="margin-top: 4px; font-size: 11px; color: #6C3CE1;">📦 Has products in our store</div>'}
        </div>
      `,
    }));

  const hasResults = allShops.length > 0;

  return (
    <div className="min-h-screen py-8 px-4 max-w-7xl mx-auto">
      {/* ───── Header ───── */}
      <div className="text-center mb-8 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 mb-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <HiLocationMarker className="text-primary-light text-xl" />
          <span className="text-primary-light font-semibold text-sm">Google Maps Powered</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold mb-3">
          <span className="gradient-text">Nearby</span> Shop Discovery
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto">
          Search for any product and find real shops near you — powered by Google Maps.
        </p>
      </div>

      {/* ───── Product Search Bar ───── */}
      <form onSubmit={handleProductSearch} className="max-w-3xl mx-auto mb-4 animate-fade-in-up stagger-1">
        <div className="flex items-center glass-card !rounded-2xl overflow-hidden">
          <HiSearch className="text-xl text-muted ml-4" />
          <input
            type="text"
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            placeholder="Search product — e.g. iPhone, Laptop, Shoes…"
            className="flex-1 bg-transparent border-none outline-none px-4 py-4 text-text placeholder:text-muted"
          />
          <button type="submit" className="btn-primary !rounded-xl mr-2 !py-2.5 !px-6">
            Find Shops
          </button>
        </div>
      </form>

      {/* Quick Search Chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-6 animate-fade-in-up stagger-1">
        {quickSearches.map((q) => (
          <button
            key={q}
            onClick={() => { setProductQuery(q); fetchNearbyShops(userLocation[0], userLocation[1], q); }}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-card border border-border/40 text-muted hover:text-primary-light hover:border-primary/40 transition-all"
          >
            {q}
          </button>
        ))}
      </div>

      {/* ───── Location Search Bar ───── */}
      <div className="relative max-w-3xl mx-auto mb-8 animate-fade-in-up stagger-2">
        <div className="flex items-center glass-card !rounded-xl overflow-hidden !py-0">
          <HiLocationMarker className="text-lg text-muted ml-4" />
          <input
            type="text"
            value={locationQuery}
            onChange={handleLocationSearchChange}
            onFocus={() => locationResults.length > 0 && setShowLocationDropdown(true)}
            placeholder="Change location — e.g. Ameerpet, Hyderabad"
            className="flex-1 bg-transparent border-none outline-none px-3 py-3 text-sm text-text placeholder:text-muted"
          />
          <button
            onClick={() => { setCenter(DEFAULT_CENTER); setUserLocation(DEFAULT_CENTER); setLocationQuery(''); if (searchedQuery) fetchNearbyShops(DEFAULT_CENTER[0], DEFAULT_CENTER[1], searchedQuery); }}
            className="mr-3 p-1.5 rounded-lg text-muted hover:text-primary-light transition-colors"
            title="Reset to default location"
          >
            <HiRefresh className="text-lg" />
          </button>
        </div>
        {showLocationDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 glass-card !rounded-xl overflow-hidden z-50 max-h-48 overflow-y-auto">
            {locationResults.map((result, i) => (
              <button
                key={i}
                onClick={() => handleSelectLocation(result)}
                className="w-full text-left px-4 py-2.5 hover:bg-card-hover transition-colors border-b border-border/30 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <HiLocationMarker className="text-primary-light flex-shrink-0 text-sm" />
                  <span className="text-xs text-text truncate">{result.displayName}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ───── Search Info Banner ───── */}
      {searchedQuery && !loading && (
        <div className="max-w-7xl mx-auto mb-6 animate-fade-in-up">
          <div className="glass-card p-4 flex items-center gap-3 flex-wrap" style={{ borderColor: 'rgba(66,133,244,0.3)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(66,133,244,0.15)' }}>
              <HiSearch className="text-sm" style={{ color: '#4285F4' }} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-text">
                Showing <span className="font-bold text-primary-light">{shopKeyword}</span> shops near you for
                "<span className="font-semibold">{searchedQuery}</span>"
              </p>
              <p className="text-xs text-muted">
                {googleShops.length} from Google Maps{dbShops.length > 0 ? ` • ${dbShops.length} from our store` : ''}
                {' • '}{allShops.length} total results
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ───── Loading ───── */}
      {loading && (
        <div className="text-center py-20">
          <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted mt-4">Searching nearby shops via Google Maps…</p>
        </div>
      )}

      {/* ───── No Search Yet ───── */}
      {!loading && !searchedQuery && (
        <div className="glass-card p-12 text-center max-w-xl mx-auto">
          <HiSearch className="text-5xl text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">Search for a Product</h3>
          <p className="text-muted text-sm">
            Type a product name like "iPhone", "Laptop", or "Headphones" and we'll find nearby stores selling it.
          </p>
        </div>
      )}

      {/* ───── No Results ───── */}
      {!loading && searchedQuery && !hasResults && (
        <div className="glass-card p-12 text-center max-w-xl mx-auto">
          <HiLocationMarker className="text-5xl text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">No Shops Found</h3>
          <p className="text-muted text-sm">
            No <strong>{shopKeyword}</strong> shops found within 5 km. Try a different product or change your location.
          </p>
        </div>
      )}

      {/* ───── Results: List LEFT + Map RIGHT (Google Maps Style) ───── */}
      {!loading && hasResults && (
        <div className="flex flex-col lg:flex-row gap-6 animate-fade-in-up">

          {/* LEFT: Shop List */}
          <div className="lg:w-[45%] w-full">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <HiLocationMarker className="text-primary-light" />
              Shops
              <span className="text-muted font-normal text-sm">({allShops.length} found)</span>
            </h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">

              {/* Google Places Shops */}
              {googleShops.map((shop, i) => (
                <div
                  key={`g-${i}`}
                  className={`glass-card p-4 cursor-pointer group transition-all hover:scale-[1.01] ${
                    activeShopId === `g-${i}` ? 'ring-2 ring-primary/50 !border-primary/40' : ''
                  }`}
                  onMouseEnter={() => setActiveShopId(`g-${i}`)}
                  onMouseLeave={() => setActiveShopId(null)}
                  onClick={() => setCenter([shop.lat, shop.lng])}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-text text-[15px] group-hover:text-primary-light transition-colors truncate">
                        {shop.name}
                      </h3>
                      <p className="text-xs text-muted mt-0.5 truncate">{shop.address}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <span className="text-secondary font-bold text-sm">{shop.distanceText}</span>
                      {shop.rating > 0 && (
                        <div className="flex items-center gap-1 text-gold text-xs mt-0.5 justify-end">
                          <HiStar /> {shop.rating}
                          {shop.userRatingsTotal > 0 && (
                            <span className="text-muted">({shop.userRatingsTotal})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Open/Closed + Type */}
                  <div className="flex items-center gap-3 text-xs">
                    {shop.openNow !== null && shop.openNow !== undefined && (
                      <span className={`font-semibold ${shop.openNow ? 'text-secondary' : 'text-danger'}`}>
                        {shop.openNow ? '● Open' : '● Closed'}
                      </span>
                    )}
                    <span className="text-muted flex items-center gap-1">
                      <HiExternalLink className="text-[10px]" /> Google Maps
                    </span>
                  </div>
                </div>
              ))}

              {/* DB Shops (with product listings) */}
              {dbShops.length > 0 && (
                <>
                  {googleShops.length > 0 && (
                    <div className="flex items-center gap-2 py-2">
                      <div className="flex-1 h-px bg-border/40"></div>
                      <span className="text-xs text-muted font-medium">From Our Store</span>
                      <div className="flex-1 h-px bg-border/40"></div>
                    </div>
                  )}
                  {dbShops.map((shop, i) => (
                    <div
                      key={`db-${i}`}
                      className={`glass-card p-4 cursor-pointer group transition-all hover:scale-[1.01] ${
                        activeShopId === `db-${i}` ? 'ring-2 ring-primary/50 !border-primary/40' : ''
                      }`}
                      onMouseEnter={() => setActiveShopId(`db-${i}`)}
                      onMouseLeave={() => setActiveShopId(null)}
                      onClick={() => setCenter([shop.lat || 17.385, shop.lng || 78.4867])}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-text text-[15px] group-hover:text-primary-light transition-colors truncate">
                            {shop.name}
                          </h3>
                          <p className="text-xs text-muted mt-0.5 truncate">{shop.address || 'Address N/A'}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <span className="text-secondary font-bold text-sm">{shop.distanceText}</span>
                          {shop.rating > 0 && (
                            <div className="flex items-center gap-1 text-gold text-xs mt-0.5 justify-end">
                              <HiStar /> {shop.rating}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Store info */}
                      <div className="flex items-center gap-3 text-xs text-muted mb-2">
                        {shop.phone && (
                          <span className="flex items-center gap-1">
                            <HiPhone className="flex-shrink-0" /> {shop.phone}
                          </span>
                        )}
                        {shop.timings && (
                          <span className="flex items-center gap-1">
                            <HiClock className="flex-shrink-0" /> {shop.timings}
                          </span>
                        )}
                      </div>

                      {/* Products */}
                      {shop.products && shop.products.length > 0 && (
                        <div className="border-t border-border/30 pt-2 mt-2 space-y-1.5">
                          {shop.products.slice(0, 3).map((p) => (
                            <div key={p.id} className="flex items-center gap-2">
                              <img src={p.image} alt={p.name}
                                className="w-7 h-7 rounded object-cover border border-border flex-shrink-0"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/56?text=📦'; }}
                              />
                              <span className="text-xs text-text truncate flex-1">{p.name}</span>
                              <span className="text-xs font-bold text-primary-light">₹{p.price?.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-[10px] text-primary-light mt-2 font-medium">📦 Available in our store</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* RIGHT: Map */}
          <div className="lg:w-[55%] w-full">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <HiLocationMarker className="text-secondary" /> Map
            </h2>
            <div className="glass-card overflow-hidden sticky top-24" style={{ height: '600px' }}>
              <MapView
                center={center}
                zoom={13}
                markers={markers}
                userLocation={userLocation}
                activeMarkerId={activeShopId}
              />
            </div>
            <p className="text-[10px] text-muted mt-2 text-center">Click a marker to see shop details • Scroll to zoom</p>
          </div>
        </div>
      )}
    </div>
  );
}
