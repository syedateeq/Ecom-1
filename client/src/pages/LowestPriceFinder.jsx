import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiTrendingDown, HiSearch, HiExternalLink, HiStar, HiShoppingCart, HiClock } from 'react-icons/hi';

const platforms = [
  { name: 'Amazon', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { name: 'Flipkart', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { name: 'Croma', color: 'text-green-400', bg: 'bg-green-400/10' },
  { name: 'Local Shops', color: 'text-purple-400', bg: 'bg-purple-400/10' },
];

const sampleResults = [
  { platform: 'Amazon', price: 62999, original: 79900, rating: 4.5, delivery: '2 days', inStock: true, image: 'https://via.placeholder.com/80x80?text=📱' },
  { platform: 'Flipkart', price: 63499, original: 79900, rating: 4.4, delivery: '3 days', inStock: true, image: 'https://via.placeholder.com/80x80?text=📱' },
  { platform: 'Croma', price: 65999, original: 79900, rating: 4.3, delivery: '5 days', inStock: true, image: 'https://via.placeholder.com/80x80?text=📱' },
  { platform: 'Local Shop — MobiWorld', price: 61500, original: 79900, rating: 4.7, delivery: 'Instant', inStock: true, image: 'https://via.placeholder.com/80x80?text=🏪' },
];

export default function LowestPriceFinder() {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      setSearched(true);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30">
          <HiTrendingDown className="text-secondary text-xl" />
          <span className="text-secondary font-semibold text-sm">Price Comparison Engine</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
          <span className="gradient-text">Lowest Price</span> Finder
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto">
          Compare prices across Amazon, Flipkart, Croma & local shops in one search. Find the absolute best deal instantly.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-12 animate-fade-in-up stagger-1">
        <div className="flex items-center glass-card !rounded-2xl overflow-hidden animate-pulse-glow">
          <HiSearch className="text-2xl text-muted ml-5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any product — iPhone 15, laptop, headphones..."
            className="flex-1 bg-transparent border-none outline-none px-4 py-5 text-text text-lg placeholder:text-muted"
          />
          <button type="submit" className="btn-primary !rounded-xl mr-2 text-base !py-3 !px-8">
            Compare
          </button>
        </div>
      </form>

      {/* Platform Tags */}
      <div className="flex flex-wrap justify-center gap-3 mb-12 animate-fade-in-up stagger-2">
        {platforms.map((p) => (
          <span key={p.name} className={`${p.bg} ${p.color} px-4 py-2 rounded-full text-sm font-medium border border-current/20`}>
            {p.name}
          </span>
        ))}
      </div>

      {/* Demo Results */}
      <div className="animate-fade-in-up stagger-3">
        <h2 className="text-xl font-bold mb-6 text-center">
          <span className="text-muted">Example:</span> iPhone 15 — Price Comparison
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sampleResults.map((r, i) => (
            <div key={i} className={`glass-card p-5 flex items-center gap-4 relative ${i === 3 ? 'ring-2 ring-secondary/50' : ''}`}>
              {i === 3 && (
                <div className="absolute -top-3 left-4 badge badge-cheapest">🏆 Cheapest</div>
              )}
              <img src={r.image} alt={r.platform} className="w-16 h-16 rounded-xl object-cover bg-card" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text">{r.platform}</p>
                <div className="flex items-center gap-2 mt-1">
                  <HiStar className="text-gold text-sm" />
                  <span className="text-xs text-muted">{r.rating}</span>
                  <span className="text-xs text-muted">•</span>
                  <HiClock className="text-muted text-sm" />
                  <span className="text-xs text-muted">{r.delivery}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold text-text">₹{r.price.toLocaleString()}</p>
                <p className="text-xs text-muted line-through">₹{r.original.toLocaleString()}</p>
                <span className="badge badge-discount mt-1 text-[11px]">
                  {Math.round((1 - r.price / r.original) * 100)}% off
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
