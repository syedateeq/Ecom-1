import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { HiShieldCheck, HiArrowLeft, HiCheck, HiExclamation, HiBadgeCheck, HiStar, HiOfficeBuilding, HiPhone, HiLocationMarker, HiShoppingBag } from 'react-icons/hi';

export default function TrustedPlatform() {
  const { isRetailer } = useAuth();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isRetailer) return;
    fetchData();
  }, [isRetailer]);

  const fetchData = async () => {
    try {
      const [pRes, prRes] = await Promise.all([
        API.get('/retailer/profile'),
        API.get('/retailer/products'),
      ]);
      setProfile(pRes.data);
      setProducts(prRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // Profile completeness calculation
  const checks = [
    { label: 'Shop Name', done: !!profile?.shopName, icon: <HiOfficeBuilding /> },
    { label: 'Shop Address', done: !!profile?.shopAddress, icon: <HiLocationMarker /> },
    { label: 'Phone Number', done: !!profile?.phone, icon: <HiPhone /> },
    { label: 'Category Set', done: !!profile?.category, icon: <HiStar /> },
    { label: 'At least 3 Products', done: products.length >= 3, icon: <HiShoppingBag /> },
    { label: 'Email Verified', done: true, icon: <HiCheck /> },
  ];
  const completedCount = checks.filter(c => c.done).length;
  const completeness = Math.round((completedCount / checks.length) * 100);
  const isVerified = completeness >= 80;

  const benefits = [
    { title: 'Verified Badge', desc: 'Display a trust badge on your store listing to attract more customers.', icon: <HiBadgeCheck className="text-3xl text-secondary" /> },
    { title: 'Priority Listing', desc: 'Verified shops appear higher in local search results.', icon: <HiStar className="text-3xl text-gold" /> },
    { title: 'Customer Trust', desc: 'Buyers are 3x more likely to buy from verified retailers.', icon: <HiShieldCheck className="text-3xl text-primary-light" /> },
    { title: 'Analytics Access', desc: 'Unlock detailed sales insights and customer engagement data.', icon: <HiExclamation className="text-3xl text-danger" /> },
  ];

  return (
    <div className="min-h-screen py-8 px-4 max-w-5xl mx-auto">
      <Link to="/retailer/dashboard" className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary-light transition-colors mb-6">
        <HiArrowLeft /> Back to Dashboard
      </Link>

      <div className="text-center mb-10 animate-fade-in-up">
        <h1 className="text-3xl font-extrabold mb-2 flex items-center justify-center gap-2">
          <HiShieldCheck className="text-secondary" /> <span className="gradient-text">Trusted</span> Platform
        </h1>
        <p className="text-muted">Complete your profile to earn a verified retailer badge and unlock premium benefits.</p>
      </div>

      {/* Verification Status Card */}
      <div className={`glass-card p-8 mb-8 text-center animate-fade-in-up stagger-1 ${isVerified ? 'ring-2 ring-secondary/40' : ''}`}>
        <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl ${isVerified ? 'bg-secondary/20 text-secondary' : 'bg-gold/20 text-gold'}`}>
          {isVerified ? <HiShieldCheck /> : <HiExclamation />}
        </div>
        <h2 className="text-2xl font-bold mb-2">{isVerified ? '✅ Verified Retailer' : '⏳ Verification In Progress'}</h2>
        <p className="text-muted mb-4">{isVerified ? 'Your store is verified! You enjoy all premium trust benefits.' : `Complete ${checks.length - completedCount} more step(s) to get verified.`}</p>

        {/* Progress Bar */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs text-muted mb-2">
            <span>Profile Completeness</span>
            <span className="font-bold text-text">{completeness}%</span>
          </div>
          <div className="w-full bg-card rounded-full h-3 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${isVerified ? 'bg-gradient-to-r from-secondary to-secondary-light' : 'bg-gradient-to-r from-primary to-gold'}`} style={{ width: `${completeness}%` }}></div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="glass-card p-6 mb-8 animate-fade-in-up stagger-2">
        <h3 className="font-bold mb-4">Verification Checklist</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {checks.map((c, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${c.done ? 'bg-secondary/5' : 'bg-danger/5'}`}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${c.done ? 'bg-secondary/20 text-secondary' : 'bg-danger/20 text-danger'}`}>
                {c.done ? <HiCheck /> : c.icon}
              </span>
              <span className={`text-sm font-medium ${c.done ? 'text-text' : 'text-muted'}`}>{c.label}</span>
              {c.done && <span className="ml-auto text-secondary text-xs font-semibold">Done</span>}
              {!c.done && <Link to="/retailer/dashboard" className="ml-auto text-primary-light text-xs font-semibold hover:underline">Complete →</Link>}
            </div>
          ))}
        </div>
      </div>

      {/* Trust Benefits */}
      <h3 className="text-xl font-bold mb-4">Trust Benefits</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-in-up stagger-3">
        {benefits.map((b, i) => (
          <div key={i} className="glass-card p-5 flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center flex-shrink-0">{b.icon}</div>
            <div>
              <h4 className="font-semibold text-text mb-1">{b.title}</h4>
              <p className="text-sm text-muted">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
