import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HiSearch, HiLightningBolt, HiLocationMarker, HiShieldCheck, HiTrendingDown, HiStar } from 'react-icons/hi';

export default function Home() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const features = [
    { icon: <HiTrendingDown className="text-3xl text-secondary" />, title: 'Lowest Price Finder', desc: 'Compare prices across Amazon, Flipkart, Croma & local shops instantly', link: '/lowest-price-finder' },
    { icon: <HiLocationMarker className="text-3xl text-primary-light" />, title: 'Nearby Shop Discovery', desc: 'Find local stores near you with real-time stock & prices', link: '/nearby-shops' },
    { icon: <HiLightningBolt className="text-3xl text-gold" />, title: 'Smart Recommendations', desc: 'AI-powered suggestions for Cheapest, Best Value & Nearest deals', link: '/smart-recommendations' },
    { icon: <HiShieldCheck className="text-3xl text-danger" />, title: 'Retailer Dashboard', desc: 'Local shopkeepers can list products and reach nearby customers', link: '/retailer-dashboard' },
  ];

  const quickSearches = ['iPhone 15', 'Samsung Galaxy S24', 'Nike Shoes', 'Laptop', 'Mixer Grinder', 'Headphones'];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background gradient blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-sm text-primary-light font-medium animate-fade-in-up">
            🚀 Compare Online + Local Prices in One Search
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight animate-fade-in-up stagger-1">
            Find the <span className="gradient-text">Smartest Deal</span><br />
            Online & Nearby
          </h1>

          <p className="text-lg md:text-xl text-muted mb-10 max-w-2xl mx-auto animate-fade-in-up stagger-2">
            Stop checking multiple websites. Search once to compare online prices,
            discover nearby shops, and get personalized recommendations.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="animate-fade-in-up stagger-3">
            <div className="relative max-w-2xl mx-auto">
              <div className="flex items-center glass-card !rounded-2xl animate-pulse-glow overflow-hidden">
                <HiSearch className="text-2xl text-muted ml-5" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for any product... iPhone 15, laptop, mixer grinder"
                  className="flex-1 bg-transparent border-none outline-none px-4 py-5 text-text text-lg placeholder:text-muted"
                />
                <button type="submit" className="btn-primary !rounded-xl mr-2 text-base !py-3 !px-8">
                  Search
                </button>
              </div>
            </div>
          </form>

          {/* Quick Search Tags */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 animate-fade-in-up stagger-4">
            <span className="text-sm text-muted mr-2">Try:</span>
            {quickSearches.map(tag => (
              <button
                key={tag}
                onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                className="px-3 py-1 rounded-full text-xs bg-card border border-border text-muted hover:border-primary hover:text-primary-light transition-all cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why <span className="gradient-text">SmartCart</span>?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <Link key={i} to={f.link} className="glass-card p-6 text-center animate-fade-in-up block hover:scale-[1.03] transition-transform duration-300" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="mb-4 flex justify-center">{f.icon}</div>
              <h3 className="font-semibold text-text mb-2">{f.title}</h3>
              <p className="text-sm text-muted">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 max-w-4xl mx-auto border-t border-border">
        <h2 className="text-3xl font-bold text-center mb-12">
          How It <span className="gradient-text">Works</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Search Any Product', desc: 'Type what you\'re looking for — phones, shoes, anything' },
            { step: '02', title: 'Compare All Options', desc: 'See online prices, nearby shops, discounts, ratings & distance' },
            { step: '03', title: 'Pick the Best Deal', desc: 'Follow our smart labels — Cheapest, Best Value, or Visit Store' },
          ].map((s, i) => (
            <div key={i} className="text-center animate-fade-in-up" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="text-5xl font-extrabold gradient-text mb-4">{s.step}</div>
              <h3 className="font-semibold text-text mb-2">{s.title}</h3>
              <p className="text-sm text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Retailer CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto glass-card p-10 md:p-16 text-center">
          <HiShieldCheck className="text-5xl text-secondary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Are You a Local Shopkeeper?</h2>
          <p className="text-muted mb-8 max-w-xl mx-auto">
            List your products on SmartCart and reach thousands of nearby customers.
            Easy product upload, barcode scanning, and inventory management.
          </p>
          <a href="/retailer/signup" className="btn-primary text-lg !py-4 !px-10 inline-block">
            Register Your Shop →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 text-center text-muted text-sm">
        <p>© 2026 SmartCart — Compare Online. Discover Local. Save Smart.</p>
        <p className="mt-1 text-xs">Built with ❤️ for Hackathon MVP Demo</p>
      </footer>
    </div>
  );
}
