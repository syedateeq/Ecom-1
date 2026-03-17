import { useState, useEffect, useCallback } from 'react';
import { HiLocationMarker, HiShoppingBag, HiStar, HiClock, HiPhone, HiArrowRight, HiBadgeCheck } from 'react-icons/hi';
import API from '../utils/api';
import MapView from './MapView';

/**
 * NearbyStoresFinder — Displays nearby shops selling a specific product
 * Uses Google Places API via backend + local DB matching.
 *
 * @param {Object} props
 * @param {string} props.keyword — product name/search term
 */
export default function NearbyStoresFinder({ keyword }) {
  const [shops, setShops] = useState([]);
  const [googlePlaces, setGooglePlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [activeShopIdx, setActiveShopIdx] = useState(null);
  const [mapCenter, setMapCenter] = useState([17.385, 78.4867]);
  const [showMap, setShowMap] = useState(false);

  // Get user location once
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          setMapCenter(loc);
        },
        () => {
          // Default Hyderabad
          setUserLocation([17.385, 78.4867]);
        },
        { timeout: 6000 }
      );
    } else {
      setUserLocation([17.385, 78.4867]);
    }
  }, []);

  // Fetch nearby shops when keyword or location changes
  const fetchNearby = useCallback(async () => {
    if (!keyword || !userLocation) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await API.get('/discover/nearby', {
        params: {
          lat: userLocation[0],
          lng: userLocation[1],
          keyword,
          radius: 5000,
        },
      });
      setShops(data.shops || []);
      setGooglePlaces(data.googlePlaces || []);
    } catch (err) {
      console.error('Nearby discover error:', err);
      setError('Could not fetch nearby stores.');
    } finally {
      setLoading(false);
    }
  }, [keyword, userLocation]);

  useEffect(() => {
    fetchNearby();
  }, [fetchNearby]);

  // Don't render anything if no keyword
  if (!keyword) return null;

  // Build map markers
  const markers = [
    ...shops.map((shop, i) => ({
      id: `shop-${i}`,
      lat: shop.lat || 17.385,
      lng: shop.lng || 78.4867,
      name: shop.shopName,
      cheapest: shop.nearestAndCheapest,
      popupContent: `
        <div style="font-family: Inter, system-ui, sans-serif; min-width: 200px;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #1a1a2e;">${shop.shopName}</div>
          <div style="font-size: 12px; color: #555; margin-bottom: 6px;">📍 ${shop.shopAddress || 'Address N/A'}</div>
          <div style="display: flex; gap: 12px; font-size: 12px; color: #444; margin-bottom: 6px;">
            <span>📏 ${shop.distanceText}</span>
            <span>⭐ ${shop.rating || '-'}</span>
          </div>
          ${shop.products.length > 0 ? `
            <div style="border-top: 1px solid #eee; padding-top: 6px; margin-top: 4px;">
              ${shop.products.slice(0, 2).map(p => `
                <div style="font-size: 12px; display: flex; justify-content: space-between; margin-bottom: 3px;">
                  <span style="color: #333; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.name}</span>
                  <span style="font-weight: 700; color: #6C3CE1;">₹${p.price.toLocaleString()}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${shop.nearestAndCheapest ? '<div style="margin-top: 6px; font-size: 11px; color: #00C853; font-weight: 700;">🏆 Nearest & Cheapest</div>' : ''}
        </div>
      `,
    })),
    ...googlePlaces.map((gp, i) => ({
      id: `gp-${i}`,
      lat: gp.lat,
      lng: gp.lng,
      name: gp.shopName,
      popupContent: `
        <div style="font-family: Inter, system-ui, sans-serif; min-width: 180px;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #1a1a2e;">${gp.shopName}</div>
          <div style="font-size: 12px; color: #555; margin-bottom: 4px;">📍 ${gp.shopAddress || ''}</div>
          <div style="font-size: 12px; color: #444;">📏 ${gp.distanceText} • ⭐ ${gp.rating || '-'} (${gp.googleReviews || 0} reviews)</div>
          <div style="margin-top: 6px; font-size: 11px; color: #FF9800; font-weight: 600;">🌐 Found via Google Maps</div>
        </div>
      `,
    })),
  ];

  const allDisplayShops = [...shops, ...googlePlaces];
  const hasResults = allDisplayShops.length > 0;

  return (
    <div className="mt-10 animate-fade-in-up">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HiLocationMarker className="text-secondary" />
            Nearby Stores
            {hasResults && (
              <span className="text-sm text-muted font-normal ml-1">
                ({shops.length} matched{googlePlaces.length > 0 ? ` + ${googlePlaces.length} from Google Maps` : ''})
              </span>
            )}
          </h2>
          <p className="text-sm text-muted mt-1">
            Physical stores near you selling "<span className="text-primary-light font-medium">{keyword}</span>"
          </p>
        </div>
        {hasResults && (
          <button
            onClick={() => setShowMap(!showMap)}
            className="btn-secondary text-xs !py-2 !px-4 flex items-center gap-1"
          >
            <HiLocationMarker /> {showMap ? 'Hide Map' : 'Show Map'}
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="glass-card p-8 text-center">
          <div className="inline-block w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted mt-3 text-sm">Discovering nearby stores via Google Maps…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="glass-card p-5 text-center" style={{ borderColor: 'rgba(255,77,106,0.3)' }}>
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {/* No Results */}
      {!loading && !error && !hasResults && keyword && (
        <div className="glass-card p-8 text-center">
          <HiLocationMarker className="text-4xl text-muted mx-auto mb-3" />
          <p className="text-muted text-sm">No nearby stores found selling this product.</p>
          <p className="text-xs text-muted mt-1">Try a different product or allow location access.</p>
        </div>
      )}

      {/* Map */}
      {!loading && hasResults && showMap && (
        <div className="glass-card overflow-hidden mb-6" style={{ height: '350px' }}>
          <MapView
            center={mapCenter}
            zoom={13}
            markers={markers}
            userLocation={userLocation}
            activeMarkerId={activeShopIdx !== null ? `shop-${activeShopIdx}` : null}
          />
        </div>
      )}

      {/* Matched DB Shops (with products) */}
      {!loading && shops.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {shops.map((shop, i) => (
            <div
              key={`nearby-shop-${i}`}
              className={`glass-card p-5 transition-all duration-200 hover:scale-[1.02] cursor-pointer relative ${
                activeShopIdx === i ? 'ring-2 ring-primary/50' : ''
              }`}
              onMouseEnter={() => { setActiveShopIdx(i); }}
              onMouseLeave={() => { setActiveShopIdx(null); }}
              onClick={() => { setMapCenter([shop.lat || 17.385, shop.lng || 78.4867]); setShowMap(true); }}
            >
              {/* Nearest & Cheapest Badge */}
              {shop.nearestAndCheapest && (
                <div className="absolute -top-2 -right-2 z-10">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #00C853, #00E676)', color: '#fff' }}>
                    <HiBadgeCheck /> Nearest & Cheapest
                  </span>
                </div>
              )}

              {/* Shop Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-text text-base">{shop.shopName}</h3>
                  <span className="text-xs text-muted">{shop.category}</span>
                </div>
                <div className="text-right">
                  <span className="text-secondary font-bold text-sm">{shop.distanceText}</span>
                  {shop.rating > 0 && (
                    <div className="flex items-center gap-1 text-gold text-xs mt-1 justify-end">
                      <HiStar /> {shop.rating}
                    </div>
                  )}
                </div>
              </div>

              {/* Address & Info */}
              <div className="space-y-1.5 text-xs text-muted mb-3">
                <div className="flex items-center gap-1.5">
                  <HiLocationMarker className="text-primary-light flex-shrink-0" />
                  <span className="truncate">{shop.shopAddress || 'Address N/A'}</span>
                </div>
                {shop.phone && (
                  <div className="flex items-center gap-1.5">
                    <HiPhone className="text-secondary flex-shrink-0" />
                    <span>{shop.phone}</span>
                  </div>
                )}
                {shop.timings && (
                  <div className="flex items-center gap-1.5">
                    <HiClock className="text-gold flex-shrink-0" />
                    <span>{shop.timings}</span>
                  </div>
                )}
              </div>

              {/* Google Place badge */}
              {shop.googlePlace && (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: 'rgba(66,133,244,0.12)', color: '#4285F4', border: '1px solid rgba(66,133,244,0.25)' }}>
                    ✓ Verified on Google Maps
                    {shop.googlePlace.googleReviews > 0 && ` • ${shop.googlePlace.googleReviews} reviews`}
                  </span>
                </div>
              )}

              {/* Stock Summary */}
              <div className="flex items-center gap-2 mb-3">
                <span className="badge badge-cheapest text-[10px]">
                  <HiShoppingBag className="mr-0.5" /> {shop.totalProducts} products
                </span>
                <span className={`badge text-[10px] ${shop.inStockCount > 0 ? 'badge-cheapest' : 'badge-discount'}`}>
                  {shop.inStockCount > 0 ? `${shop.inStockCount} in stock` : 'Out of stock'}
                </span>
              </div>

              {/* Product Listing */}
              {shop.products.length > 0 && (
                <div className="border-t border-border/30 pt-3 space-y-2">
                  {shop.products.slice(0, 3).map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <img src={p.image} alt={p.name}
                        className="w-8 h-8 rounded-lg object-cover border border-border flex-shrink-0"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/80?text=📦'; }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text truncate font-medium">{p.name}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted">
                          <span className="text-text font-bold">₹{p.price.toLocaleString()}</span>
                          {p.mrp > p.price && (
                            <span className="line-through">₹{p.mrp.toLocaleString()}</span>
                          )}
                          {p.discount > 0 && (
                            <span className="text-danger font-semibold">{p.discount}% off</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                        p.stock > 0 ? 'bg-secondary/15 text-secondary' : 'bg-danger/15 text-danger'
                      }`}>
                        {p.stock > 0 ? `${p.stock} left` : 'Out'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/30">
                <span className="text-[10px] text-muted">View on map</span>
                <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary-light text-xs hover:bg-primary hover:text-white transition-all">
                  <HiArrowRight />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Google-only Places (not in our DB) */}
      {!loading && googlePlaces.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted mb-3 flex items-center gap-2">
            🌐 Other Nearby Shops from Google Maps
            <span className="text-xs font-normal">({googlePlaces.length} found)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {googlePlaces.slice(0, 8).map((gp, i) => (
              <div
                key={`gp-${i}`}
                className="glass-card p-4 transition-all hover:scale-[1.02] cursor-pointer"
                onClick={() => { setMapCenter([gp.lat, gp.lng]); setShowMap(true); }}
              >
                <h4 className="font-semibold text-text text-sm mb-1 truncate">{gp.shopName}</h4>
                <p className="text-xs text-muted truncate mb-2">{gp.shopAddress}</p>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span className="text-secondary font-bold">{gp.distanceText}</span>
                  {gp.rating > 0 && (
                    <span className="flex items-center gap-0.5 text-gold">
                      <HiStar /> {gp.rating}
                    </span>
                  )}
                  {gp.openNow !== null && (
                    <span className={gp.openNow ? 'text-secondary' : 'text-danger'}>
                      {gp.openNow ? '● Open' : '● Closed'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
