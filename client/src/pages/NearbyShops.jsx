import { useState, useEffect, useCallback, useRef } from 'react';
import { HiLocationMarker, HiPhone, HiClock, HiStar, HiShoppingBag, HiSearch, HiRefresh, HiArrowRight } from 'react-icons/hi';
import API from '../utils/api';
import { searchLocation } from '../utils/geocoding';
import MapView from '../components/MapView';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [17.385, 78.4867]; // Hyderabad

export default function NearbyShops() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [userLocation, setUserLocation] = useState(DEFAULT_CENTER);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeShopId, setActiveShopId] = useState(null);
  const debounceRef = useRef(null);

  // Fetch nearby shops from API
  const fetchShops = useCallback(async (lat, lng) => {
    setLoading(true);
    try {
      const { data } = await API.get(`/products/nearby-shops?lat=${lat}&lng=${lng}&radius=20`);
      setShops(data.shops || []);
    } catch (err) {
      console.error('Failed to fetch shops:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount, try geolocation then fetch
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setCenter(loc);
          fetchShops(loc[0], loc[1]);
        },
        () => fetchShops(DEFAULT_CENTER[0], DEFAULT_CENTER[1]),
        { timeout: 5000 }
      );
    } else {
      fetchShops(DEFAULT_CENTER[0], DEFAULT_CENTER[1]);
    }
  }, [fetchShops]);

  // Debounced location search (500ms)
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await searchLocation(val);
      setSearchResults(results);
      setShowDropdown(results.length > 0);
    }, 500);
  };

  const handleSelectLocation = (loc) => {
    setCenter([loc.lat, loc.lng]);
    setUserLocation([loc.lat, loc.lng]);
    setSearchQuery(loc.displayName.split(',').slice(0, 2).join(','));
    setShowDropdown(false);
    fetchShops(loc.lat, loc.lng);
  };

  // Build map markers
  const markers = shops.map((shop) => ({
    id: shop.id,
    lat: shop.lat,
    lng: shop.lng,
    name: shop.shopName,
    popupContent: `
      <div style="font-family: Inter, system-ui, sans-serif; min-width: 220px;">
        <div style="font-weight: 700; font-size: 15px; margin-bottom: 6px; color: #1a1a2e;">${shop.shopName}</div>
        <div style="font-size: 12px; color: #555; margin-bottom: 8px;">📍 ${shop.shopAddress || 'Address not available'}</div>
        <div style="display: flex; gap: 14px; font-size: 12px; color: #444; margin-bottom: 8px;">
          <span>⭐ ${shop.rating}</span>
          <span>📦 ${shop.totalProducts} items</span>
          <span>📏 ${shop.distance} km</span>
        </div>
        ${shop.products.length > 0 ? `
          <div style="border-top: 1px solid #e5e5e5; padding-top: 8px; margin-top: 4px;">
            <div style="font-size: 11px; color: #999; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Top Products</div>
            ${shop.products.slice(0, 3).map(p => `
              <div style="font-size: 12px; display: flex; justify-content: space-between; margin-bottom: 4px; line-height: 1.6;">
                <span style="color: #333; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.name}</span>
                <span style="font-weight: 700; color: #6C3CE1;">₹${p.price.toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        <div style="margin-top: 8px; font-size: 12px;">
          <span style="color: ${shop.inStockCount > 0 ? '#00D4AA' : '#FF4D6A'}; font-weight: 600;">
            ${shop.inStockCount > 0 ? `✅ ${shop.inStockCount} in stock` : '❌ Out of stock'}
          </span>
        </div>
      </div>
    `,
  }));

  return (
    <div className="min-h-screen py-10 px-4 max-w-7xl mx-auto">
      {/* ───── Header ───── */}
      <div className="text-center mb-10 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <HiLocationMarker className="text-primary-light text-xl" />
          <span className="text-primary-light font-semibold text-sm">Location-Based Discovery</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
          <span className="gradient-text">Nearby</span> Shop Discovery
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto">
          Find local stores near you with real-time stock, prices, and distance. Support local businesses while getting great deals.
        </p>
      </div>

      {/* ───── Location Search Bar ───── */}
      <div className="relative max-w-2xl mx-auto mb-10 animate-fade-in-up stagger-1">
        <div className="flex items-center glass-card !rounded-2xl overflow-hidden">
          <HiSearch className="text-xl text-muted ml-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            placeholder="Search location — e.g. Ameerpet, Hyderabad"
            className="flex-1 bg-transparent border-none outline-none px-4 py-4 text-text placeholder:text-muted"
          />
          <button
            onClick={() => { setCenter(DEFAULT_CENTER); setUserLocation(DEFAULT_CENTER); fetchShops(DEFAULT_CENTER[0], DEFAULT_CENTER[1]); setSearchQuery(''); }}
            className="mr-3 p-2 rounded-lg text-muted hover:text-primary-light transition-colors"
            title="Reset to default location"
          >
            <HiRefresh className="text-xl" />
          </button>
        </div>

        {/* Search Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 glass-card !rounded-xl overflow-hidden z-50 max-h-60 overflow-y-auto">
            {searchResults.map((result, i) => (
              <button
                key={i}
                onClick={() => handleSelectLocation(result)}
                className="w-full text-left px-4 py-3 hover:bg-card-hover transition-colors border-b border-border/30 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <HiLocationMarker className="text-primary-light flex-shrink-0" />
                  <span className="text-sm text-text truncate">{result.displayName}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ───── Map + Shop Cards — Side by Side on Desktop ───── */}
      <div className="flex flex-col lg:flex-row gap-6 animate-fade-in-up stagger-2">

        {/* Left Panel: Interactive Map */}
        <div className="lg:w-1/2 w-full">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <HiLocationMarker className="text-primary-light" /> Map View
          </h2>
          <div className="glass-card overflow-hidden" style={{ height: '520px' }}>
            <MapView
              center={center}
              zoom={12}
              markers={markers}
              userLocation={userLocation}
              activeMarkerId={activeShopId}
            />
          </div>
          <p className="text-xs text-muted mt-2 text-center">Click a marker to see shop details • Scroll to zoom</p>
        </div>

        {/* Right Panel: Shop Cards List */}
        <div className="lg:w-1/2 w-full">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <HiShoppingBag className="text-primary" /> Shops near you
            <span className="text-muted font-normal text-sm ml-1">({shops.length} found)</span>
          </h2>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : shops.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <HiLocationMarker className="text-5xl text-muted mx-auto mb-4" />
              <p className="text-muted">No shops found nearby. Try searching a different location.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
              {shops.map((shop, i) => (
                <div
                  key={shop.id}
                  className={`glass-card p-5 cursor-pointer group transition-all ${activeShopId === shop.id ? 'ring-2 ring-primary/50 !border-primary/40' : ''}`}
                  onMouseEnter={() => setActiveShopId(shop.id)}
                  onMouseLeave={() => setActiveShopId(null)}
                  onClick={() => setCenter([shop.lat, shop.lng])}
                >
                  {/* Top Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-text text-lg group-hover:text-primary-light transition-colors">
                        {shop.shopName}
                      </h3>
                      <span className="badge badge-nearby mt-1">{shop.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-gold">
                        <HiStar />
                        <span className="font-bold text-sm">{shop.rating}</span>
                      </div>
                      <span className={`text-xs font-semibold mt-1 block text-secondary`}>
                        {shop.distance} km away
                      </span>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted">
                      <HiLocationMarker className="text-primary-light flex-shrink-0" />
                      <span className="truncate">{shop.shopAddress || 'Address N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted">
                      <HiClock className="text-gold flex-shrink-0" />
                      <span className="truncate">{shop.timings || '9:00 AM - 9:00 PM'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted">
                      <HiPhone className="text-secondary flex-shrink-0" />
                      <span className="truncate">{shop.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted">
                      <HiShoppingBag className="text-danger flex-shrink-0" />
                      <span>{shop.totalProducts} products ({shop.inStockCount} in stock)</span>
                    </div>
                  </div>

                  {/* Price Range */}
                  {shop.priceRange && (
                    <div className="text-xs text-muted mb-3">
                      Price range: <span className="text-text font-semibold">₹{shop.priceRange.min.toLocaleString()}</span>
                      {' — '}
                      <span className="text-text font-semibold">₹{shop.priceRange.max.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Product Preview */}
                  {shop.products.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
                      {shop.products.slice(0, 4).map((p) => (
                        <div key={p.id} className="flex-shrink-0 w-20 text-center">
                          <img src={p.image} alt={p.name} className="w-16 h-16 rounded-lg object-cover mx-auto border border-border" />
                          <p className="text-[10px] text-muted mt-1 truncate">{p.name}</p>
                          <p className="text-[11px] font-bold text-text">₹{p.price.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* View on map CTA */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <span className="text-xs text-muted">Click to view on map</span>
                    <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary-light group-hover:bg-primary group-hover:text-white transition-all text-sm">
                      <HiArrowRight />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ───── Detailed Nearby Store Cards Section (Below Map) ───── */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HiShoppingBag className="text-secondary" /> All Nearby Stores
            <span className="text-muted font-normal text-base ml-1">({shops.length} stores)</span>
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : shops.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <HiLocationMarker className="text-6xl text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text mb-2">No Nearby Stores Found</h3>
            <p className="text-muted max-w-md mx-auto">
              We couldn't find any stores near your current location. Try searching for a different area using the search bar above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <div
                key={`detail-${shop.id}`}
                className={`glass-card overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer ${activeShopId === shop.id ? 'ring-2 ring-primary/60 !border-primary/40' : ''}`}
                onMouseEnter={() => setActiveShopId(shop.id)}
                onMouseLeave={() => setActiveShopId(null)}
                onClick={() => setCenter([shop.lat, shop.lng])}
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-5 py-4 border-b border-border/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-text text-lg">{shop.shopName}</h3>
                      <span className="badge badge-nearby mt-1">{shop.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-gold">
                        <HiStar />
                        <span className="font-bold">{shop.rating}</span>
                      </div>
                      <span className="text-xs font-bold text-secondary block mt-1">{shop.distance} km</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5">
                  {/* Store Info */}
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted">
                      <HiLocationMarker className="text-primary-light flex-shrink-0" />
                      <span className="truncate">{shop.shopAddress || 'Address not available'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted">
                      <HiPhone className="text-secondary flex-shrink-0" />
                      <span>{shop.phone || 'Contact not available'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted">
                      <HiClock className="text-gold flex-shrink-0" />
                      <span>{shop.timings || '9:00 AM - 9:00 PM'}</span>
                    </div>
                  </div>

                  {/* Stock Summary */}
                  <div className="flex items-center gap-4 mb-4 text-xs">
                    <span className="badge badge-cheapest">
                      <HiShoppingBag className="mr-1" /> {shop.totalProducts} Products
                    </span>
                    <span className={`badge ${shop.inStockCount > 0 ? 'badge-cheapest' : 'badge-discount'}`}>
                      {shop.inStockCount > 0 ? `${shop.inStockCount} In Stock` : 'Out of Stock'}
                    </span>
                  </div>

                  {/* Product Listings */}
                  {shop.products.length > 0 && (
                    <div className="border-t border-border/30 pt-4 mb-4">
                      <p className="text-xs text-muted uppercase tracking-wider mb-3">Products Available</p>
                      <div className="space-y-3">
                        {shop.products.slice(0, 3).map((p) => (
                          <div key={p.id} className="flex items-center gap-3">
                            <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-border flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text truncate">{p.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted">
                                <span className="text-text font-bold">₹{p.price.toLocaleString()}</span>
                                {p.mrp > p.price && (
                                  <span className="line-through">₹{p.mrp.toLocaleString()}</span>
                                )}
                                {p.discount > 0 && (
                                  <span className="text-danger font-semibold">{p.discount}% off</span>
                                )}
                              </div>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.stock > 0 ? 'bg-secondary/15 text-secondary' : 'bg-danger/15 text-danger'}`}>
                              {p.stock > 0 ? `${p.stock} left` : 'Out'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Range */}
                  {shop.priceRange && (
                    <div className="text-xs text-muted mb-4">
                      Price range: <span className="text-text font-semibold">₹{shop.priceRange.min.toLocaleString()}</span>
                      {' — '}
                      <span className="text-text font-semibold">₹{shop.priceRange.max.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Visit Store Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setCenter([shop.lat, shop.lng]); setActiveShopId(shop.id); }}
                    className="w-full btn-primary flex items-center justify-center gap-2 !py-3 !rounded-xl text-sm"
                  >
                    <HiLocationMarker /> Visit Store on Map
                    <HiArrowRight />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
