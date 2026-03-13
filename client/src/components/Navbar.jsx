import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiMenu, HiX, HiShoppingCart, HiUser, HiLogout, HiShieldCheck } from 'react-icons/hi';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isLoggedIn, isRetailer, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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

          {/* Mobile menu button */}
          <button onClick={() => setOpen(!open)} className="md:hidden text-muted hover:text-text text-2xl">
            {open ? <HiX /> : <HiMenu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {open && (
          <div className="md:hidden pb-4 border-t border-border mt-2 pt-4 flex flex-col gap-3 animate-fade-in-up">
            <Link to="/search" onClick={() => setOpen(false)} className="text-muted hover:text-text text-sm">Search Products</Link>
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
