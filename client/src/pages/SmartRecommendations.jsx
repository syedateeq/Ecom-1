import { HiLightningBolt, HiTrendingDown, HiStar, HiLocationMarker, HiShoppingCart, HiClock } from 'react-icons/hi';

const recommendations = [
  {
    label: 'Cheapest',
    badgeClass: 'badge-cheapest',
    icon: <HiTrendingDown className="text-secondary text-2xl" />,
    description: 'Lowest price available across all platforms',
    items: [
      { name: 'iPhone 15 (128GB)', source: 'Local — MobiWorld', price: 61500, original: 79900, distance: '1.2 km', rating: 4.7, image: 'https://via.placeholder.com/64x64?text=📱' },
      { name: 'Sony WH-1000XM5', source: 'Amazon', price: 22990, original: 34990, distance: 'Online', rating: 4.6, image: 'https://via.placeholder.com/64x64?text=🎧' },
    ],
  },
  {
    label: 'Best Value',
    badgeClass: 'badge-best-value',
    icon: <HiStar className="text-gold text-2xl" />,
    description: 'Best combination of price, rating & reliability',
    items: [
      { name: 'Samsung Galaxy S24', source: 'Flipkart', price: 57999, original: 74999, distance: 'Online', rating: 4.5, image: 'https://via.placeholder.com/64x64?text=📱' },
      { name: 'Nike Air Max 270', source: 'Local — ShoeMart', price: 8999, original: 12995, distance: '3.5 km', rating: 4.8, image: 'https://via.placeholder.com/64x64?text=👟' },
    ],
  },
  {
    label: 'Nearest',
    badgeClass: 'badge-nearby',
    icon: <HiLocationMarker className="text-primary-light text-2xl" />,
    description: 'Available at the closest store to your location',
    items: [
      { name: 'Mixer Grinder (Preethi)', source: 'Local — Krishna Store', price: 3499, original: 4999, distance: '0.8 km', rating: 4.4, image: 'https://via.placeholder.com/64x64?text=🍳' },
      { name: 'Boat Airdopes 141', source: 'Local — TechZone', price: 1299, original: 1999, distance: '1.5 km', rating: 4.2, image: 'https://via.placeholder.com/64x64?text=🎵' },
    ],
  },
];

export default function SmartRecommendations() {
  return (
    <div className="min-h-screen py-10 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-gold/10 border border-gold/30">
          <HiLightningBolt className="text-gold text-xl" />
          <span className="text-gold font-semibold text-sm">AI-Powered Engine</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
          <span className="gradient-text">Smart</span> Recommendations
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto">
          Get AI-powered suggestions curated just for you — Cheapest deals, Best Value picks, and Nearest available products.
        </p>
      </div>

      {/* Recommendation Sections */}
      {recommendations.map((section, si) => (
        <div key={section.label} className="mb-10 animate-fade-in-up" style={{ animationDelay: `${si * 0.15}s` }}>
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center border border-border">
              {section.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-text">{section.label}</h2>
                <span className={`badge ${section.badgeClass}`}>{section.label}</span>
              </div>
              <p className="text-sm text-muted">{section.description}</p>
            </div>
          </div>

          {/* Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.items.map((item, ii) => (
              <div key={ii} className="glass-card p-5 flex items-center gap-4 cursor-pointer group">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover bg-card border border-border" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text group-hover:text-primary-light transition-colors truncate">{item.name}</p>
                  <p className="text-xs text-muted mt-1">{item.source}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <HiStar className="text-gold" /> {item.rating}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <HiLocationMarker className="text-primary-light" /> {item.distance}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-extrabold text-text">₹{item.price.toLocaleString()}</p>
                  <p className="text-xs text-muted line-through">₹{item.original.toLocaleString()}</p>
                  <span className="badge badge-discount mt-1 text-[11px]">
                    {Math.round((1 - item.price / item.original) * 100)}% off
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* CTA */}
      <div className="glass-card p-8 text-center mt-6 animate-fade-in-up stagger-4">
        <HiLightningBolt className="text-4xl text-gold mx-auto mb-3" />
        <h3 className="text-xl font-bold mb-2">Want personalized recommendations?</h3>
        <p className="text-muted text-sm mb-5">Search for any product and our AI will instantly find the best deals for you.</p>
        <a href="/" className="btn-primary inline-block !py-3 !px-8">Search Products</a>
      </div>
    </div>
  );
}
