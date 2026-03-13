import { Link } from 'react-router-dom';
import { HiShieldCheck, HiShoppingBag, HiCurrencyRupee, HiQrcode, HiChartBar, HiUserGroup, HiArrowRight } from 'react-icons/hi';

const benefits = [
  { icon: <HiShoppingBag className="text-2xl text-secondary" />, title: 'Product Listing', desc: 'List all your products with prices, images, and discounts' },
  { icon: <HiQrcode className="text-2xl text-primary-light" />, title: 'Barcode Scanner', desc: 'Scan barcodes to quickly add products to your inventory' },
  { icon: <HiCurrencyRupee className="text-2xl text-gold" />, title: 'Price Management', desc: 'Update MRP, selling price, and discounts in real-time' },
  { icon: <HiChartBar className="text-2xl text-danger" />, title: 'Sales Insights', desc: 'Track views, clicks, and customer engagement trends' },
  { icon: <HiUserGroup className="text-2xl text-secondary-light" />, title: 'Local Reach', desc: 'Get discovered by thousands of nearby customers' },
  { icon: <HiShieldCheck className="text-2xl text-primary" />, title: 'Trusted Platform', desc: 'Verified retailer badge builds trust with customers' },
];

const steps = [
  { step: '01', title: 'Create Account', desc: 'Sign up with your shop details in under 2 minutes' },
  { step: '02', title: 'Add Products', desc: 'List your products using our easy form or barcode scanner' },
  { step: '03', title: 'Go Live', desc: 'Your products appear in local search results instantly' },
];

export default function RetailerLanding() {
  return (
    <div className="min-h-screen py-10 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-danger/10 border border-danger/30">
          <HiShieldCheck className="text-danger text-xl" />
          <span className="text-danger font-semibold text-sm">For Local Shopkeepers</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
          <span className="gradient-text">Retailer</span> Dashboard
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto">
          List your products on SmartCart and reach thousands of nearby customers. Manage your shop, track sales, and grow your business.
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up stagger-1">
        <Link to="/retailer/login" className="btn-primary !py-4 !px-10 text-lg flex items-center gap-2">
          Login to Dashboard <HiArrowRight />
        </Link>
        <Link to="/retailer/signup" className="btn-secondary !py-4 !px-10 text-lg">
          Register Your Shop
        </Link>
      </div>

      {/* Benefits Grid */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8 animate-fade-in-up stagger-2">
          Why join <span className="gradient-text">SmartCart</span>?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <div key={i} className="glass-card p-6 text-center animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center mx-auto mb-4">
                {b.icon}
              </div>
              <h3 className="font-semibold text-text mb-2">{b.title}</h3>
              <p className="text-sm text-muted">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">
          Get started in <span className="gradient-text">3 simple steps</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={i} className="text-center animate-fade-in-up" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="text-5xl font-extrabold gradient-text mb-4">{s.step}</div>
              <h3 className="font-semibold text-text mb-2">{s.title}</h3>
              <p className="text-sm text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="glass-card p-10 text-center animate-fade-in-up stagger-4">
        <HiShieldCheck className="text-5xl text-secondary mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-3">Ready to grow your business?</h2>
        <p className="text-muted mb-6 max-w-lg mx-auto">
          Join hundreds of local retailers on SmartCart. Free to sign up, easy to manage.
        </p>
        <Link to="/retailer/signup" className="btn-primary text-lg !py-4 !px-10 inline-block">
          Register Your Shop →
        </Link>
      </div>
    </div>
  );
}
