import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import {
  HiArrowLeft, HiStar, HiTag, HiLocationMarker, HiPhone,
  HiMail, HiClock, HiExternalLink, HiShoppingCart
} from 'react-icons/hi';

/**
 * StoreProductDetail — "Visit Store" page
 * Route: /store/:shopId/product/:productId
 *
 * Shows full product + full shop details with action buttons.
 *
 * FUTURE MAP INTEGRATION NOTES:
 * 1. Install: npm install @react-google-maps/api
 * 2. Use VITE_GOOGLE_MAPS_API_KEY from client/.env
 * 3. Replace the #map-container div below with <GoogleMap> component
 * 4. See: https://react-google-maps-api-docs.netlify.app/
 */

export default function StoreProductDetail() {
  const { shopId, productId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user location from localStorage or use defaults (Hyderabad)
        const lat = localStorage.getItem('smartcart_lat') || 17.385;
        const lng = localStorage.getItem('smartcart_lng') || 78.4867;

        const { data: res } = await API.get(
          `/products/store/${shopId}/product/${productId}?lat=${lat}&lng=${lng}`
        );
        setData(res);
      } catch (err) {
        console.error('Error fetching store product:', err);
        setError(err.response?.data?.message || 'Failed to load store details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [shopId, productId]);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted text-sm">Loading store details...</p>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-card p-8 max-w-md">
          <p className="text-danger text-lg mb-2">😕 {error || 'Store not found'}</p>
          <button onClick={() => navigate(-1)} className="btn-primary mt-4">
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const { product, shop } = data;
  const discount = product.discount || (product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0);
  const savings = product.mrp > product.price ? product.mrp - product.price : 0;

  // Build Google Maps URL from address
  const mapsQuery = encodeURIComponent(shop.shopAddress || shop.shopName);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  // WhatsApp link with pre-filled message
  const whatsappNumber = shop.whatsapp || shop.phone;
  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in "${product.name}" listed at ₹${product.price?.toLocaleString()} at ${shop.shopName}. Is it available?`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen py-6 px-4 max-w-5xl mx-auto">

      {/* ── Back Button ── */}
      <button
        onClick={() => navigate(-1)}
        className="text-muted hover:text-text text-sm flex items-center gap-1 mb-6 transition-colors"
      >
        <HiArrowLeft /> Back to Results
      </button>

      {/* ── Hero Section: Product Image + Info ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">

        {/* Product Image */}
        <div className="glass-card overflow-hidden relative">
          <img
            src={product.image || 'https://via.placeholder.com/500?text=Product'}
            alt={product.name}
            className="w-full h-72 md:h-96 object-cover"
          />
          {discount > 0 && (
            <span className="absolute top-4 left-4 badge badge-discount text-sm">
              <HiTag /> {discount}% OFF
            </span>
          )}
          {product.stock > 0 ? (
            <span className="absolute top-4 right-4 badge badge-cheapest text-sm">
              ✅ In Stock ({product.stock})
            </span>
          ) : (
            <span className="absolute top-4 right-4 badge badge-discount text-sm">
              ❌ Out of Stock
            </span>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-4">
          {/* Category Badge */}
          <div className="flex flex-wrap gap-2">
            <span className="badge badge-nearby">{product.category}</span>
            {product.barcode && (
              <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#8888AA', border: '1px solid rgba(255,255,255,0.1)' }}>
                🏷️ {product.barcode}
              </span>
            )}
          </div>

          {/* Product Name */}
          <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>

          {/* Description */}
          <p className="text-muted text-sm leading-relaxed">{product.description || 'No description available.'}</p>

          {/* Price Breakdown */}
          <div className="glass-card p-4">
            <div className="flex items-end gap-3 mb-2">
              <span className="text-3xl font-bold text-text">
                ₹{product.price?.toLocaleString()}
              </span>
              {product.mrp > product.price && (
                <span className="text-lg text-muted line-through">
                  ₹{product.mrp?.toLocaleString()}
                </span>
              )}
            </div>
            {savings > 0 && (
              <p className="text-secondary text-sm font-medium">
                💰 You save ₹{savings.toLocaleString()} ({discount}% off)
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted">
              <span>MRP: ₹{product.mrp?.toLocaleString()}</span>
              <span>•</span>
              <span>Final Price: ₹{product.price?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Shop Info Section ── */}
      <div className="mt-8 animate-fade-in-up stagger-2">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          🏪 Shop Details
        </h2>
        <div className="glass-card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Left: Shop Identity */}
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-bold text-text">{shop.shopName}</h3>
                <p className="text-muted text-sm">{shop.category} Store</p>
              </div>

              <div className="flex items-center gap-2">
                <HiStar className="text-gold" />
                <span className="text-text font-medium">{shop.rating}</span>
                <span className="text-muted text-xs">/ 5.0 rating</span>
              </div>

              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-muted">
                  <span className="text-primary">👤</span>
                  <span className="text-text">{shop.shopkeeperName}</span>
                  <span className="text-muted">— Shopkeeper</span>
                </p>

                <p className="flex items-center gap-2 text-muted">
                  <HiPhone className="text-primary" />
                  <a href={`tel:${shop.phone}`} className="text-text hover:text-primary transition-colors">
                    {shop.phone}
                  </a>
                </p>

                {shop.whatsapp && (
                  <p className="flex items-center gap-2 text-muted">
                    <span className="text-green-400">💬</span>
                    <span className="text-text">{shop.whatsapp}</span>
                    <span className="text-muted">— WhatsApp</span>
                  </p>
                )}

                {shop.email && (
                  <p className="flex items-center gap-2 text-muted">
                    <HiMail className="text-primary" />
                    <a href={`mailto:${shop.email}`} className="text-text hover:text-primary transition-colors">
                      {shop.email}
                    </a>
                  </p>
                )}

                <p className="flex items-center gap-2 text-muted">
                  <HiClock className="text-primary" />
                  <span className="text-text">{shop.timings}</span>
                </p>
              </div>
            </div>

            {/* Right: Location & Distance */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-text flex items-center gap-2 mb-2">
                  <HiLocationMarker className="text-primary" /> Location
                </h4>
                <p className="text-text text-sm">{shop.shopAddress || 'Address not available'}</p>
                {(shop.lat && shop.lng) && (
                  <p className="text-muted text-xs mt-1">
                    📍 Lat: {shop.lat}, Lng: {shop.lng}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="badge badge-nearby">
                  📏 {shop.distance} km away
                </span>
              </div>

              {/*
                ── MAP CONTAINER (Future Integration) ──
                Replace this div with an actual map component when ready:

                import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
                const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

                <LoadScript googleMapsApiKey={apiKey}>
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '200px', borderRadius: '12px' }}
                    center={{ lat: shop.lat, lng: shop.lng }}
                    zoom={15}
                  >
                    <Marker position={{ lat: shop.lat, lng: shop.lng }} />
                  </GoogleMap>
                </LoadScript>
              */}
              <div
                id="map-container"
                className="w-full h-36 rounded-xl flex items-center justify-center text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(108,60,225,0.1), rgba(0,212,170,0.1))',
                  border: '1px dashed rgba(108,60,225,0.3)'
                }}
              >
                <div>
                  <p className="text-muted text-xs mb-2">🗺️ Map preview coming soon</p>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary text-xs hover:underline flex items-center justify-center gap-1"
                  >
                    Open in Google Maps <HiExternalLink />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="mt-8 animate-fade-in-up stagger-3">
        <h2 className="text-xl font-bold mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          {/* Call Shop */}
          <a
            href={`tel:${shop.phone}`}
            className="glass-card p-4 text-center hover:border-primary/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/25 transition-colors">
              <HiPhone className="text-primary text-xl" />
            </div>
            <p className="text-text text-sm font-medium">Call Shop</p>
            <p className="text-muted text-xs mt-1">{shop.phone}</p>
          </a>

          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="glass-card p-4 text-center hover:border-green-500/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-2 group-hover:bg-green-500/25 transition-colors">
              <span className="text-green-400 text-xl">💬</span>
            </div>
            <p className="text-text text-sm font-medium">WhatsApp</p>
            <p className="text-muted text-xs mt-1">Chat with shop</p>
          </a>

          {/* Get Directions */}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="glass-card p-4 text-center hover:border-secondary/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-secondary/15 flex items-center justify-center mx-auto mb-2 group-hover:bg-secondary/25 transition-colors">
              <HiLocationMarker className="text-secondary text-xl" />
            </div>
            <p className="text-text text-sm font-medium">Get Directions</p>
            <p className="text-muted text-xs mt-1">{shop.distance} km away</p>
          </a>

          {/* Back to Results */}
          <button
            onClick={() => navigate(-1)}
            className="glass-card p-4 text-center hover:border-muted/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-muted/15 flex items-center justify-center mx-auto mb-2 group-hover:bg-muted/25 transition-colors">
              <HiArrowLeft className="text-muted text-xl" />
            </div>
            <p className="text-text text-sm font-medium">Go Back</p>
            <p className="text-muted text-xs mt-1">Return to results</p>
          </button>
        </div>
      </div>

      {/* ── Footer Note ── */}
      <div className="mt-8 mb-8 text-center">
        <p className="text-muted text-xs">
          💡 Prices and availability are subject to change. Contact the shop to confirm before visiting.
        </p>
      </div>
    </div>
  );
}
