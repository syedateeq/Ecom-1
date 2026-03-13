import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../utils/api';
import { HiStar, HiLocationMarker, HiTag, HiShoppingCart, HiArrowLeft, HiExternalLink } from 'react-icons/hi';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [onlinePrices, setOnlinePrices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await API.get(`/products/${id}`);
        setProduct(data.product);
        setOnlinePrices(data.onlinePrices || []);
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted">Product not found</p>
      </div>
    );
  }

  const discount = product.discount || Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const shop = product.retailerId;

  // Find cheapest online price
  const cheapestOnline = onlinePrices.length > 0
    ? onlinePrices.reduce((min, p) => p.price < min.price ? p : min, onlinePrices[0])
    : null;

  const isOfflineCheaper = cheapestOnline ? product.price < cheapestOnline.price : true;

  return (
    <div className="min-h-screen py-8 px-4 max-w-5xl mx-auto">
      <Link to="/search" className="text-muted hover:text-text text-sm flex items-center gap-1 mb-6">
        <HiArrowLeft /> Back to Search
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
        {/* Product Image */}
        <div className="glass-card overflow-hidden">
          <img src={product.image || 'https://via.placeholder.com/500?text=Product'}
            alt={product.name} className="w-full h-80 object-cover" />
        </div>

        {/* Product Info */}
        <div>
          <span className="badge badge-nearby mb-3">{product.category}</span>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-muted text-sm mb-4">{product.description}</p>

          {/* Price */}
          <div className="flex items-end gap-3 mb-4">
            <span className="text-3xl font-bold text-text">₹{product.price?.toLocaleString()}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-lg text-muted line-through">₹{product.mrp?.toLocaleString()}</span>
                <span className="badge badge-discount"><HiTag /> {discount}% OFF</span>
              </>
            )}
          </div>

          {/* Shop Info */}
          {shop && (
            <div className="glass-card p-4 mb-4">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <HiLocationMarker className="text-primary" /> Sold at Local Shop
              </h3>
              <p className="text-text font-medium">{shop.shopName}</p>
              <p className="text-xs text-muted">{shop.shopAddress}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-muted">
                  <HiStar className="text-gold" /> {shop.rating}
                </span>
                <span className="text-xs text-secondary">{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span>
              </div>
            </div>
          )}

          {/* Online vs Offline Verdict */}
          <div className={`p-4 rounded-xl border ${isOfflineCheaper ? 'bg-secondary/10 border-secondary/30' : 'bg-primary/10 border-primary/30'} mb-4`}>
            <p className="text-sm font-semibold">
              {isOfflineCheaper
                ? '🏪 Local shop has the best price! Visit the store.'
                : '🌐 Online price is cheaper! Buy online to save more.'}
            </p>
            {cheapestOnline && (
              <p className="text-xs text-muted mt-1">
                Cheapest online: ₹{cheapestOnline.price?.toLocaleString()} on {cheapestOnline.platform}
                {!isOfflineCheaper && ` (Save ₹${(product.price - cheapestOnline.price).toLocaleString()})`}
              </p>
            )}
          </div>

          <button className="btn-primary w-full !py-3 flex items-center justify-center gap-2 text-base">
            <HiShoppingCart /> {isOfflineCheaper ? 'Visit Store' : 'Buy Online'}
          </button>
        </div>
      </div>

      {/* Online Price Comparison Table */}
      {onlinePrices.length > 0 && (
        <div className="mt-10 animate-fade-in-up stagger-2">
          <h2 className="text-xl font-bold mb-4">📊 Online Price Comparison</h2>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="p-4 text-muted font-medium">Platform</th>
                    <th className="p-4 text-muted font-medium">Price</th>
                    <th className="p-4 text-muted font-medium">Rating</th>
                    <th className="p-4 text-muted font-medium">Delivery</th>
                    <th className="p-4 text-muted font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {onlinePrices.sort((a, b) => a.price - b.price).map((op, i) => (
                    <tr key={i} className={`border-b border-border/50 ${i === 0 ? 'bg-secondary/5' : ''}`}>
                      <td className="p-4 font-medium">
                        {op.platform}
                        {i === 0 && <span className="ml-2 badge badge-cheapest text-xs">Lowest</span>}
                      </td>
                      <td className="p-4 font-bold text-text">₹{op.price?.toLocaleString()}</td>
                      <td className="p-4"><span className="flex items-center gap-1"><HiStar className="text-gold" /> {op.rating}</span></td>
                      <td className="p-4 text-muted">{op.deliveryDays} days</td>
                      <td className="p-4">
                        <a href={op.url} target="_blank" rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 text-xs">
                          Visit <HiExternalLink />
                        </a>
                      </td>
                    </tr>
                  ))}
                  {/* Add the local shop as a row */}
                  <tr className="bg-primary/5">
                    <td className="p-4 font-medium">
                      🏪 {shop?.shopName || 'Local Shop'}
                      {isOfflineCheaper && <span className="ml-2 badge badge-best-value text-xs">Best Deal</span>}
                    </td>
                    <td className="p-4 font-bold text-text">₹{product.price?.toLocaleString()}</td>
                    <td className="p-4"><span className="flex items-center gap-1"><HiStar className="text-gold" /> {shop?.rating || 4.0}</span></td>
                    <td className="p-4 text-secondary">Instant</td>
                    <td className="p-4 text-xs text-muted">Visit Store</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
