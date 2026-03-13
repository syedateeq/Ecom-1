import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { HiShoppingBag, HiPlus, HiTrash, HiPencil, HiCheck, HiX, HiArrowLeft, HiSearch } from 'react-icons/hi';

export default function RetailerProducts() {
  const { isRetailer } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isRetailer) return;
    fetchProducts();
  }, [isRetailer]);

  const fetchProducts = async () => {
    try {
      const { data } = await API.get('/retailer/products');
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await API.delete(`/retailer/products/${id}`);
      setProducts(products.filter(p => p._id !== id));
    } catch (err) { console.error(err); }
  };

  const toggleAvailability = async (product) => {
    try {
      const { data } = await API.put(`/retailer/products/${product._id}`, {
        availability: !product.availability
      });
      setProducts(products.map(p => p._id === data._id ? data : p));
    } catch (err) { console.error(err); }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4 max-w-6xl mx-auto">
      <Link to="/retailer/dashboard" className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary-light transition-colors mb-6">
        <HiArrowLeft /> Back to Dashboard
      </Link>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HiShoppingBag className="text-primary" /> Product Listing
          </h1>
          <p className="text-muted text-sm">{products.length} products in your inventory</p>
        </div>
        <Link to="/retailer/add-product" className="btn-primary flex items-center gap-2">
          <HiPlus /> Add New Product
        </Link>
      </div>

      {/* Search */}
      <div className="glass-card !rounded-2xl overflow-hidden flex items-center mb-6">
        <HiSearch className="text-xl text-muted ml-4" />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or category..."
          className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-text placeholder:text-muted"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: products.length, color: 'text-primary' },
          { label: 'Active', value: products.filter(p => p.availability).length, color: 'text-secondary' },
          { label: 'Hidden', value: products.filter(p => !p.availability).length, color: 'text-danger' },
          { label: 'Avg Price', value: `₹${products.length ? Math.round(products.reduce((s, p) => s + p.price, 0) / products.length).toLocaleString() : 0}`, color: 'text-gold' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <HiShoppingBag className="text-5xl text-muted mx-auto mb-4" />
          <p className="text-muted mb-4">{search ? 'No products match your search' : 'No products listed yet'}</p>
          <Link to="/retailer/add-product" className="btn-primary">Add Your First Product</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(product => (
            <div key={product._id} className="glass-card overflow-hidden group">
              <div className="relative">
                <img src={product.image || 'https://via.placeholder.com/300x200'} alt={product.name} className="w-full h-44 object-cover" />
                <span className={`absolute top-3 right-3 badge ${product.availability ? 'badge-cheapest' : 'badge-discount'}`}>
                  {product.availability ? 'Active' : 'Hidden'}
                </span>
                {product.discount > 0 && (
                  <span className="absolute top-3 left-3 badge badge-discount">{product.discount}% OFF</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-text truncate">{product.name}</h3>
                <p className="text-xs text-muted mb-3">{product.category}</p>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-lg font-extrabold text-text">₹{product.price?.toLocaleString()}</span>
                  {product.mrp > product.price && <span className="text-sm text-muted line-through">₹{product.mrp?.toLocaleString()}</span>}
                </div>
                <div className="flex items-center justify-between text-xs text-muted mb-4">
                  <span>Stock: {product.stock}</span>
                  <span className={product.stock > 5 ? 'text-secondary' : 'text-danger'}>{product.stock > 5 ? 'Healthy' : product.stock > 0 ? 'Low Stock' : 'Out'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleAvailability(product)} className={`flex-1 text-xs py-2 rounded-lg font-semibold transition-colors ${product.availability ? 'bg-danger/15 text-danger hover:bg-danger/25' : 'bg-secondary/15 text-secondary hover:bg-secondary/25'}`}>
                    {product.availability ? <><HiX className="inline mr-1" />Hide</> : <><HiCheck className="inline mr-1" />Show</>}
                  </button>
                  <button onClick={() => deleteProduct(product._id)} className="p-2 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors">
                    <HiTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
