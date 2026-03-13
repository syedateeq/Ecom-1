import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { HiPlus, HiPencil, HiTrash, HiOfficeBuilding, HiShoppingBag, HiCurrencyRupee, HiCheck, HiX } from 'react-icons/hi';

export default function RetailerDashboard() {
  const { user, isRetailer } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});

  useEffect(() => {
    if (!isRetailer) { navigate('/retailer/login'); return; }
    fetchData();
  }, [isRetailer]);

  const fetchData = async () => {
    try {
      const [profileRes, productsRes] = await Promise.all([
        API.get('/retailer/profile'),
        API.get('/retailer/products')
      ]);
      setProfile(profileRes.data);
      setProfileForm(profileRes.data);
      setProducts(productsRes.data);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      const { data } = await API.put('/retailer/profile', profileForm);
      setProfile(data);
      setEditingProfile(false);
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await API.delete(`/retailer/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const toggleAvailability = async (product) => {
    try {
      const { data } = await API.put(`/retailer/products/${product._id}`, {
        availability: !product.availability
      });
      setProducts(products.map(p => p._id === data._id ? data : p));
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Retailer Dashboard</h1>
          <p className="text-muted text-sm">Welcome back, {user?.name}!</p>
        </div>
        <Link to="/retailer/add-product" className="btn-primary flex items-center gap-2">
          <HiPlus /> Add Product
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in-up">
        {[
          { icon: <HiShoppingBag className="text-primary text-2xl" />, label: 'Total Products', value: products.length },
          { icon: <HiCheck className="text-secondary text-2xl" />, label: 'In Stock', value: products.filter(p => p.availability).length },
          { icon: <HiX className="text-danger text-2xl" />, label: 'Out of Stock', value: products.filter(p => !p.availability).length },
          { icon: <HiCurrencyRupee className="text-gold text-2xl" />, label: 'Avg. Price', value: `₹${products.length ? Math.round(products.reduce((s, p) => s + p.price, 0) / products.length).toLocaleString() : 0}` },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4 text-center">
            <div className="flex justify-center mb-2">{stat.icon}</div>
            <p className="text-2xl font-bold text-text">{stat.value}</p>
            <p className="text-xs text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Shop Profile Card */}
      <div className="glass-card p-6 mb-8 animate-fade-in-up stagger-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HiOfficeBuilding className="text-secondary" /> Shop Profile
          </h2>
          <button onClick={() => setEditingProfile(!editingProfile)}
            className="btn-secondary text-xs !py-1.5 !px-3 flex items-center gap-1">
            <HiPencil /> {editingProfile ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editingProfile ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted block mb-1">Shop Name</label>
              <input value={profileForm.shopName || ''} onChange={e => setProfileForm({ ...profileForm, shopName: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Address</label>
              <input value={profileForm.shopAddress || ''} onChange={e => setProfileForm({ ...profileForm, shopAddress: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Phone</label>
              <input value={profileForm.phone || ''} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Category</label>
              <input value={profileForm.category || ''} onChange={e => setProfileForm({ ...profileForm, category: e.target.value })} className="input-field" />
            </div>
            <div className="md:col-span-2">
              <button onClick={updateProfile} className="btn-primary !py-2">Save Changes</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-muted block text-xs">Shop Name</span><span className="font-medium">{profile?.shopName}</span></div>
            <div><span className="text-muted block text-xs">Address</span><span className="font-medium">{profile?.shopAddress || '—'}</span></div>
            <div><span className="text-muted block text-xs">Phone</span><span className="font-medium">{profile?.phone || '—'}</span></div>
            <div><span className="text-muted block text-xs">Category</span><span className="font-medium">{profile?.category}</span></div>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="animate-fade-in-up stagger-2">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <HiShoppingBag className="text-primary" /> Your Products ({products.length})
        </h2>

        {products.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <HiShoppingBag className="text-5xl text-muted mx-auto mb-4" />
            <p className="text-muted mb-4">No products listed yet</p>
            <Link to="/retailer/add-product" className="btn-primary">Add Your First Product</Link>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="p-4 text-muted font-medium">Product</th>
                    <th className="p-4 text-muted font-medium">Price</th>
                    <th className="p-4 text-muted font-medium">MRP</th>
                    <th className="p-4 text-muted font-medium">Discount</th>
                    <th className="p-4 text-muted font-medium">Stock</th>
                    <th className="p-4 text-muted font-medium">Status</th>
                    <th className="p-4 text-muted font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product._id} className="border-b border-border/50 hover:bg-card-hover transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={product.image || 'https://via.placeholder.com/40'} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <p className="font-medium text-text truncate max-w-[200px]">{product.name}</p>
                            <p className="text-xs text-muted">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-text">₹{product.price?.toLocaleString()}</td>
                      <td className="p-4 text-muted">₹{product.mrp?.toLocaleString()}</td>
                      <td className="p-4"><span className="badge badge-discount">{product.discount}%</span></td>
                      <td className="p-4 text-text">{product.stock}</td>
                      <td className="p-4">
                        <button onClick={() => toggleAvailability(product)}
                          className={`badge cursor-pointer ${product.availability ? 'badge-cheapest' : 'badge-discount'}`}>
                          {product.availability ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => deleteProduct(product._id)}
                            className="text-danger hover:text-danger/80 transition-colors">
                            <HiTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
