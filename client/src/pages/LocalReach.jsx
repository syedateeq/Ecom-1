import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { HiUserGroup, HiArrowLeft, HiEye, HiLocationMarker, HiTrendingUp, HiGlobe, HiSearch } from 'react-icons/hi';

export default function LocalReach() {
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

  // Simulated reach analytics
  const reachStats = {
    totalDiscoveries: Math.floor(Math.random() * 3000) + 1200,
    uniqueCustomers: Math.floor(Math.random() * 800) + 300,
    searchAppearances: Math.floor(Math.random() * 5000) + 2000,
    profileViews: Math.floor(Math.random() * 1500) + 500,
  };
  const radiusBreakdown = [
    { range: '0-1 km', customers: Math.floor(Math.random() * 200) + 100, pct: 35 },
    { range: '1-3 km', customers: Math.floor(Math.random() * 300) + 150, pct: 30 },
    { range: '3-5 km', customers: Math.floor(Math.random() * 200) + 80, pct: 20 },
    { range: '5-10 km', customers: Math.floor(Math.random() * 100) + 30, pct: 10 },
    { range: '10+ km', customers: Math.floor(Math.random() * 50) + 10, pct: 5 },
  ];

  const weeklyTrend = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({
    day: d,
    views: Math.floor(Math.random() * 150) + 30,
  }));
  const maxWeekly = Math.max(...weeklyTrend.map(d => d.views));

  return (
    <div className="min-h-screen py-8 px-4 max-w-6xl mx-auto">
      <Link to="/retailer/dashboard" className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary-light transition-colors mb-6">
        <HiArrowLeft /> Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2"><HiUserGroup className="text-secondary-light" /> Local Reach</h1>
        <p className="text-muted text-sm">See how many nearby customers are discovering your store and products.</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-fade-in-up">
        {[
          { icon: <HiEye className="text-primary text-2xl" />, label: 'Total Discoveries', value: reachStats.totalDiscoveries.toLocaleString() },
          { icon: <HiUserGroup className="text-secondary text-2xl" />, label: 'Unique Customers', value: reachStats.uniqueCustomers.toLocaleString() },
          { icon: <HiSearch className="text-gold text-2xl" />, label: 'Search Appearances', value: reachStats.searchAppearances.toLocaleString() },
          { icon: <HiGlobe className="text-danger text-2xl" />, label: 'Profile Views', value: reachStats.profileViews.toLocaleString() },
        ].map((s, i) => (
          <div key={i} className="glass-card p-5 text-center">
            <div className="flex justify-center mb-2">{s.icon}</div>
            <p className="text-2xl font-bold text-text">{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Your Location */}
      <div className="glass-card p-5 mb-8 animate-fade-in-up stagger-1">
        <h3 className="font-bold mb-3 flex items-center gap-2"><HiLocationMarker className="text-primary-light" /> Your Store Location</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div><span className="text-xs text-muted block">Shop Name</span><span className="font-semibold">{profile?.shopName}</span></div>
          <div><span className="text-xs text-muted block">Address</span><span className="font-semibold">{profile?.shopAddress || 'Not set'}</span></div>
          <div><span className="text-xs text-muted block">Products Listed</span><span className="font-semibold">{products.length}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radius Breakdown */}
        <div className="glass-card p-5 animate-fade-in-up stagger-2">
          <h3 className="font-bold mb-4 flex items-center gap-2"><HiLocationMarker className="text-primary-light" /> Discovery by Distance</h3>
          <div className="space-y-3">
            {radiusBreakdown.map((r, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-text font-medium">{r.range}</span>
                  <span className="text-muted text-xs">{r.customers} customers ({r.pct}%)</span>
                </div>
                <div className="w-full bg-card rounded-full h-2.5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${r.pct * 2}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="glass-card p-5 animate-fade-in-up stagger-3">
          <h3 className="font-bold mb-4 flex items-center gap-2"><HiTrendingUp className="text-secondary" /> Weekly Discovery Trend</h3>
          <div className="flex items-end gap-2 h-40">
            {weeklyTrend.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted">{d.views}</span>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-primary to-primary-light transition-all" style={{ height: `${(d.views / maxWeekly) * 100}%`, minHeight: '8px' }}></div>
                <span className="text-[10px] text-muted">{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
