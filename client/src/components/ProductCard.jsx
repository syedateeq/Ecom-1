import { useState } from 'react';
import { HiStar, HiLocationMarker, HiTag, HiShoppingCart } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product, type = 'offline', recommendation }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const discount = type === 'online'
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : product.discount || 0;

  const badgeClass = {
    'Cheapest Online': 'badge-cheapest',
    'Best Nearby Shop': 'badge-nearby',
    'Best Overall Value': 'badge-best-value',
  }[recommendation] || '';

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart({
      productId: product._id || product.id,
      name: product.name || product.productName,
      price: product.price,
      image: product.image,
      store: product.shopName || product.platform || '',
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div
      className="glass-card overflow-hidden cursor-pointer group"
      onClick={() => type === 'offline' && navigate(`/product/${product._id}`)}
    >
      {/* Product Image */}
      <div className="relative overflow-hidden h-48">
        <img
          src={product.image || 'https://via.placeholder.com/400x300?text=Product'}
          alt={product.name || product.productName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {discount > 0 && (
          <span className="absolute top-3 left-3 badge badge-discount">
            <HiTag className="text-xs" /> {discount}% OFF
          </span>
        )}
        {recommendation && (
          <span className={`absolute top-3 right-3 badge ${badgeClass}`}>
            ⭐ {recommendation}
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-text text-sm mb-1 truncate">
          {product.name || product.productName}
        </h3>

        {type === 'offline' && product.shopName && (
          <p className="text-xs text-muted flex items-center gap-1 mb-2">
            <HiLocationMarker className="text-primary" />
            {product.shopName} • {product.distance}km away
          </p>
        )}

        {type === 'online' && (
          <p className="text-xs text-muted mb-2">
            via <span className="text-secondary font-medium">{product.platform}</span>
            {product.deliveryDays && ` • ${product.deliveryDays} day delivery`}
          </p>
        )}

        {/* Price */}
        <div className="flex items-end gap-2 mb-2">
          <span className="text-lg font-bold text-text">₹{product.price?.toLocaleString()}</span>
          {(product.mrp || product.originalPrice) && product.price < (product.mrp || product.originalPrice) && (
            <span className="text-sm text-muted line-through">₹{(product.mrp || product.originalPrice)?.toLocaleString()}</span>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1">
          <HiStar className="text-gold text-sm" />
          <span className="text-xs text-muted">{product.rating || product.shopRating || '4.0'}</span>
          {type === 'offline' && product.stock !== undefined && (
            <span className={`text-xs ml-auto ${product.stock > 0 ? 'text-secondary' : 'text-danger'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-3 flex flex-col gap-2">
          <button
            onClick={handleAddToCart}
            className={`${added ? 'btn-secondary' : 'btn-primary'} text-xs !py-2 w-full flex items-center justify-center gap-1 transition-all`}
          >
            {added ? '✓ Added' : <><HiShoppingCart /> Add to Cart</>}
          </button>
          {type === 'online' ? (
            <a
              href={product.url || '#'}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="btn-secondary text-xs !py-2 block text-center w-full"
            >
              Buy Now →
            </a>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/store/${product.retailerId}/product/${product._id}`);
              }}
              className="btn-secondary text-xs !py-2 block text-center w-full"
            >
              🏪 Visit Store →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
