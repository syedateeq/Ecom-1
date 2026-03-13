import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { HiMenu, HiX, HiShoppingCart, HiUser, HiLogout, HiShieldCheck } from 'react-icons/hi';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isLoggedIn, isRetailer, user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const CartIcon = ({ className = '' }) => (
    <Link to="/cart" onClick={() => setOpen(false)} className={`relative text-muted hover:text-text transition-colors ${className}`}>
      <HiShoppingCart className="text-2xl" />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse-glow">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-dark/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <HiShoppingCart className="text-2xl text-primary" />
            <span className="text-xl font-bold gradient-text">SmartCart</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/search" className="text-muted hover:text-text transition-colors text-sm font-medium">
              Search
            </Link>
            <CartIcon />
            {isLoggedIn ? (
              <>
                {isRetailer ? (
                  <Link to="/retailer/dashboard" className="text-muted hover:text-text transition-colors text-sm font-medium">
                    Dashboard
                  </Link>
                ) : null}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted">
                    {isRetailer ? <HiShieldCheck className="inline mr-1 text-secondary" /> : <HiUser className="inline mr-1" />}
                    {user?.name}
                  </span>
                  <button onClick={handleLogout} className="btn-secondary text-sm !py-2 !px-4 flex items-center gap-1">
                    <HiLogout /> Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-muted hover:text-text transition-colors text-sm font-medium">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary text-sm !py-2 !px-4">
                  Sign Up
                </Link>
                <Link to="/retailer/login" className="btn-secondary text-sm !py-2 !px-4 flex items-center gap-1">
                  <HiShieldCheck /> Retailer
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: cart icon + menu button */}
          <div className="md:hidden flex items-center gap-4">
            <CartIcon />
            <button onClick={() => setOpen(!open)} className="text-muted hover:text-text text-2xl">
              {open ? <HiX /> : <HiMenu />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {open && (
          <div className="md:hidden pb-4 border-t border-border mt-2 pt-4 flex flex-col gap-3 animate-fade-in-up">
            <Link to="/search" onClick={() => setOpen(false)} className="text-muted hover:text-text text-sm">Search Products</Link>
            <Link to="/cart" onClick={() => setOpen(false)} className="text-muted hover:text-text text-sm flex items-center gap-2">
              🛒 Cart {totalItems > 0 && <span className="badge badge-cheapest">{totalItems}</span>}
            </Link>
            {isLoggedIn ? (
              <>
                {isRetailer && (
                  <Link to="/retailer/dashboard" onClick={() => setOpen(false)} className="text-muted hover:text-text text-sm">Dashboard</Link>
                )}
                <span className="text-sm text-muted">Logged in as {user?.name}</span>
                <button onClick={() => { handleLogout(); setOpen(false); }} className="btn-secondary text-sm !py-2">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="text-muted hover:text-text text-sm">User Login</Link>
                <Link to="/signup" onClick={() => setOpen(false)} className="btn-primary text-sm !py-2 text-center">Sign Up</Link>
                <Link to="/retailer/login" onClick={() => setOpen(false)} className="btn-secondary text-sm !py-2 text-center">Retailer Login</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
