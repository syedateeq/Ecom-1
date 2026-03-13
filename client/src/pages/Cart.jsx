import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { HiTrash, HiPlus, HiMinus, HiShoppingCart } from 'react-icons/hi';

export default function Cart() {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 animate-fade-in-up">
        <div className="glass-card p-12 text-center max-w-md w-full">
          <HiShoppingCart className="text-6xl text-muted mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text mb-2">Your cart is empty</h2>
          <p className="text-muted mb-6">Looks like you haven't added any products yet.</p>
          <Link to="/search" className="btn-primary inline-block">
            Browse Products →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-text flex items-center gap-3">
          <HiShoppingCart className="text-primary" />
          Your Cart
          <span className="text-sm font-normal text-muted">({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
        </h1>
        <button
          onClick={clearCart}
          className="text-sm text-danger hover:text-danger/80 transition-colors flex items-center gap-1"
        >
          <HiTrash /> Clear All
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex flex-col gap-4 mb-8">
        {items.map((item) => (
          <div key={item.productId} className="glass-card flex flex-col sm:flex-row items-center gap-4 p-4">
            {/* Image */}
            <img
              src={item.image || 'https://via.placeholder.com/120x120?text=Product'}
              alt={item.name}
              className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
            />

            {/* Info */}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h3 className="font-semibold text-text truncate">{item.name}</h3>
              {item.store && (
                <p className="text-xs text-muted mt-1">🏪 {item.store}</p>
              )}
              <p className="text-lg font-bold text-text mt-1">₹{item.price?.toLocaleString()}</p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.productId, -1)}
                className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted hover:text-text hover:border-primary transition-all"
              >
                <HiMinus className="text-sm" />
              </button>
              <span className="w-8 text-center font-semibold text-text">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.productId, 1)}
                className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted hover:text-text hover:border-primary transition-all"
              >
                <HiPlus className="text-sm" />
              </button>
            </div>

            {/* Subtotal + Remove */}
            <div className="flex flex-col items-center gap-2 min-w-[90px]">
              <span className="font-bold text-text">₹{(item.price * item.quantity).toLocaleString()}</span>
              <button
                onClick={() => removeFromCart(item.productId)}
                className="text-xs text-danger hover:text-danger/80 transition-colors flex items-center gap-1"
              >
                <HiTrash /> Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-text mb-4">Order Summary</h2>
        <div className="flex justify-between items-center text-muted mb-2">
          <span>Total Items</span>
          <span className="text-text font-medium">{totalItems}</span>
        </div>
        <div className="border-t border-border my-3"></div>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-text">Total Price</span>
          <span className="text-xl font-bold gradient-text">₹{totalPrice.toLocaleString()}</span>
        </div>
        <button className="btn-primary w-full mt-6 text-center !py-3">
          Proceed to Checkout →
        </button>
      </div>
    </div>
  );
}
