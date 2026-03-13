import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { HiChartBar, HiArrowLeft, HiEye, HiCursorClick, HiTrendingUp, HiShoppingBag, HiStar } from 'react-icons/hi';

export default function SalesInsights() {
  const { isRetailer } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isRetailer) return;
    fetchProducts();
  }, [isRetailer]);

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/retailer/products');
      // Simulate analytics data for each product
      const withAnalytics = data.map(p => ({
        ...p,
        views: Math.floor(Math.random() * 500) + 50,
        clicks: Math.floor(Math.random() * 100) + 10,
        saves: Math.floor(Math.random() * 30) + 2,
        ctr: 0,
      }));
      withAnalytics.forEach(p => { p.ctr = ((p.clicks / p.views) * 100).toFixed(1); });
      setProducts(withAnalytics);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const totalViews = products.reduce((s, p) => s + p.views, 0);
  const totalClicks = products.reduce((s, p) => s + p.clicks, 0);
  const totalSaves = products.reduce((s, p) => s + p.saves, 0);
  const avgCtr = products.length ? (totalClicks / totalViews * 100).toFixed(1) : 0;
  const topViewed = [...products].sort((a, b) => b.views - a.views).slice(0, 5);
  const topClicked = [...products].sort((a, b) => b.clicks - a.clicks).slice(0, 5);

  return (
    <div className="min-h-screen py-8 px-4 max-w-6xl mx-auto">
      <Link to="/retailer/dashboard" className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary-light transition-colors mb-6">
        <HiArrowLeft /> Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2"><HiChartBar className="text-danger" /> Sales Insights</h1>
        <p className="text-muted text-sm">Track views, clicks, and customer engagement for your products.</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-fade-in-up">
        {[
          { icon: <HiEye className="text-primary text-2xl" />, label: 'Total Views', value: totalViews.toLocaleString() },
          { icon: <HiCursorClick className="text-secondary text-2xl" />, label: 'Total Clicks', value: totalClicks.toLocaleString() },
          { icon: <HiStar className="text-gold text-2xl" />, label: 'Total Saves', value: totalSaves.toLocaleString() },
          { icon: <HiTrendingUp className="text-danger text-2xl" />, label: 'Avg CTR', value: `${avgCtr}%` },
        ].map((s, i) => (
          <div key={i} className="glass-card p-5 text-center">
            <div className="flex justify-center mb-2">{s.icon}</div>
            <p className="text-2xl font-bold text-text">{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Visual Bars — Engagement by Product */}
      <div className="glass-card p-6 mb-8 animate-fade-in-up stagger-1">
        <h2 className="text-lg font-bold mb-4">Engagement by Product</h2>
        <div className="space-y-4">
          {products.slice(0, 8).map(p => {
            const maxViews = Math.max(...products.map(x => x.views));
            return (
              <div key={p._id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-text font-medium truncate max-w-[200px]">{p.name}</span>
                  <span className="text-muted text-xs">{p.views} views • {p.clicks} clicks • {p.ctr}% CTR</span>
                </div>
                <div className="w-full bg-card rounded-full h-2.5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500" style={{ width: `${(p.views / maxViews) * 100}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up stagger-2">
        {/* Most Viewed */}
        <div className="glass-card p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><HiEye className="text-primary" /> Most Viewed</h3>
          <div className="space-y-3">
            {topViewed.map((p, i) => (
              <div key={p._id} className="flex items-center gap-3">
                <span className="text-lg font-extrabold gradient-text w-6">{i + 1}</span>
                <img src={p.image || 'https://via.placeholder.com/36'} alt="" className="w-9 h-9 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{p.name}</p>
                  <p className="text-xs text-muted">{p.category}</p>
                </div>
                <span className="text-sm font-bold text-primary">{p.views}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Clicked */}
        <div className="glass-card p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><HiCursorClick className="text-secondary" /> Most Clicked</h3>
          <div className="space-y-3">
            {topClicked.map((p, i) => (
              <div key={p._id} className="flex items-center gap-3">
                <span className="text-lg font-extrabold gradient-text w-6">{i + 1}</span>
                <img src={p.image || 'https://via.placeholder.com/36'} alt="" className="w-9 h-9 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{p.name}</p>
                  <p className="text-xs text-muted">{p.category}</p>
                </div>
                <span className="text-sm font-bold text-secondary">{p.clicks}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
