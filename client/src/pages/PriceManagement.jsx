import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { HiCurrencyRupee, HiArrowLeft, HiSave, HiPencil, HiCheck } from 'react-icons/hi';

export default function PriceManagement() {
  const { isRetailer } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // product id being edited
  const [editValues, setEditValues] = useState({});
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    if (!isRetailer) return;
    fetchProducts();
  }, [isRetailer]);

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/retailer/products');
      setProducts(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const startEdit = (product) => {
    setEditing(product._id);
    setEditValues({ price: product.price, mrp: product.mrp, discount: product.discount });
    setSaved(null);
  };

  const handleChange = (field, value) => {
    const vals = { ...editValues, [field]: parseFloat(value) || 0 };
    if (field === 'price' || field === 'mrp') {
      if (vals.mrp > 0) vals.discount = Math.round((1 - vals.price / vals.mrp) * 100);
    }
    if (field === 'discount') {
      vals.price = Math.round(vals.mrp * (1 - vals.discount / 100));
    }
    setEditValues(vals);
  };

  const savePrice = async (id) => {
    try {
      const { data } = await API.put(`/retailer/products/${id}`, {
        price: editValues.price,
        mrp: editValues.mrp,
        discount: editValues.discount,
      });
      setProducts(products.map(p => p._id === data._id ? data : p));
      setEditing(null);
      setSaved(id);
      setTimeout(() => setSaved(null), 2000);
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  // Summary stats
  const avgPrice = products.length ? Math.round(products.reduce((s, p) => s + p.price, 0) / products.length) : 0;
  const avgDiscount = products.length ? Math.round(products.reduce((s, p) => s + (p.discount || 0), 0) / products.length) : 0;
  const maxDiscount = products.length ? Math.max(...products.map(p => p.discount || 0)) : 0;
  const totalValue = products.reduce((s, p) => s + (p.price * (p.stock || 1)), 0);

  return (
    <div className="min-h-screen py-8 px-4 max-w-6xl mx-auto">
      <Link to="/retailer/dashboard" className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary-light transition-colors mb-6">
        <HiArrowLeft /> Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HiCurrencyRupee className="text-gold" /> Price Management
        </h1>
        <p className="text-muted text-sm">Update MRP, selling price, and discounts for your products.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in-up">
        {[
          { label: 'Avg Selling Price', value: `₹${avgPrice.toLocaleString()}`, color: 'text-primary' },
          { label: 'Avg Discount', value: `${avgDiscount}%`, color: 'text-secondary' },
          { label: 'Max Discount', value: `${maxDiscount}%`, color: 'text-danger' },
          { label: 'Total Inventory Value', value: `₹${totalValue.toLocaleString()}`, color: 'text-gold' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-4 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Price Table */}
      <div className="glass-card overflow-hidden animate-fade-in-up stagger-1">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="p-4 text-muted font-medium">Product</th>
                <th className="p-4 text-muted font-medium">MRP</th>
                <th className="p-4 text-muted font-medium">Selling Price</th>
                <th className="p-4 text-muted font-medium">Discount</th>
                <th className="p-4 text-muted font-medium">Margin</th>
                <th className="p-4 text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id} className={`border-b border-border/50 transition-colors ${saved === product._id ? 'bg-secondary/5' : 'hover:bg-card-hover'}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={product.image || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <p className="font-medium text-text truncate max-w-[180px]">{product.name}</p>
                        <p className="text-xs text-muted">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {editing === product._id ? (
                      <input type="number" value={editValues.mrp} onChange={e => handleChange('mrp', e.target.value)} className="input-field !py-1.5 !px-2 w-24 text-sm" />
                    ) : (
                      <span className="text-muted">₹{product.mrp?.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {editing === product._id ? (
                      <input type="number" value={editValues.price} onChange={e => handleChange('price', e.target.value)} className="input-field !py-1.5 !px-2 w-24 text-sm" />
                    ) : (
                      <span className="font-bold text-text">₹{product.price?.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {editing === product._id ? (
                      <input type="number" value={editValues.discount} onChange={e => handleChange('discount', e.target.value)} className="input-field !py-1.5 !px-2 w-20 text-sm" />
                    ) : (
                      <span className="badge badge-discount">{product.discount}%</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`font-semibold text-xs ${(product.mrp - product.price) > 0 ? 'text-secondary' : 'text-danger'}`}>
                      ₹{(product.mrp - product.price)?.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-4">
                    {editing === product._id ? (
                      <button onClick={() => savePrice(product._id)} className="btn-primary text-xs !py-1.5 !px-3 flex items-center gap-1">
                        <HiSave /> Save
                      </button>
                    ) : saved === product._id ? (
                      <span className="text-secondary flex items-center gap-1 text-xs font-semibold"><HiCheck /> Saved!</span>
                    ) : (
                      <button onClick={() => startEdit(product)} className="btn-secondary text-xs !py-1.5 !px-3 flex items-center gap-1">
                        <HiPencil /> Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
