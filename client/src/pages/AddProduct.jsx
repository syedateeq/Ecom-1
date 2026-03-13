import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { HiQrcode, HiSearch, HiPhotograph, HiArrowLeft, HiCheck, HiUpload, HiX } from 'react-icons/hi';

export default function AddProduct() {
  const { isRetailer } = useAuth();
  const navigate = useNavigate();
  const [barcode, setBarcode] = useState('');
  const [barcodeStatus, setBarcodeStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '', description: '', category: 'General', barcode: '',
    image: '', price: '', mrp: '', discount: 0, stock: 10
  });

  const categories = ['Electronics', 'Fashion', 'Footwear', 'Kitchen', 'Books', 'General'];

  // Barcode scanner lookup
  const handleBarcodeScan = async () => {
    if (!barcode.trim()) return;
    setBarcodeStatus('Searching...');
    try {
      const { data } = await API.get(`/retailer/barcode/${barcode.trim()}`);
      setForm({
        ...form,
        name: data.name || '',
        description: data.description || '',
        category: data.category || 'General',
        mrp: data.mrp || '',
        barcode: barcode.trim()
      });
      setBarcodeStatus('✅ Product found! Details pre-filled. Edit as needed.');
    } catch (err) {
      setBarcodeStatus('❌ Barcode not in database. Please fill details manually.');
    }
  };

  // Handle image file selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Remove selected image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setForm({ ...form, image: '' });
  };

  // Upload image to server
  const uploadImage = async () => {
    if (!imageFile) return form.image || '';
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const { data } = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Prepend backend URL so image loads correctly regardless of proxy configuration
      const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      return `${backendUrl}${data.imageUrl}`;
    } catch (err) {
      console.error('Upload error:', err);
      return '';
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Upload image first if a file was selected
      const imageUrl = await uploadImage();

      await API.post('/retailer/products', {
        ...form,
        price: Number(form.price),
        mrp: Number(form.mrp),
        discount: Number(form.discount),
        stock: Number(form.stock),
        image: imageUrl || 'https://via.placeholder.com/300x300?text=Product'
      });
      setSuccess(true);
      setTimeout(() => navigate('/retailer/dashboard'), 1500);
    } catch (err) {
      console.error('Add product error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate discount when price and mrp change
  const updatePrice = (field, value) => {
    const updated = { ...form, [field]: value };
    if (updated.price && updated.mrp && Number(updated.mrp) > 0) {
      updated.discount = Math.round(((Number(updated.mrp) - Number(updated.price)) / Number(updated.mrp)) * 100);
    }
    setForm(updated);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-10 text-center animate-fade-in-up">
          <HiCheck className="text-5xl text-secondary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Product Added!</h2>
          <p className="text-muted">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 max-w-3xl mx-auto">
      <button onClick={() => navigate('/retailer/dashboard')} className="text-muted hover:text-text text-sm flex items-center gap-1 mb-6">
        <HiArrowLeft /> Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-2">Add New Product</h1>
      <p className="text-muted text-sm mb-8">Scan a barcode to auto-fill or enter details manually</p>

      {/* Barcode Scanner Section */}
      <div className="glass-card p-6 mb-8 animate-fade-in-up">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <HiQrcode className="text-secondary" /> Barcode Scanner
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            placeholder="Enter barcode number (e.g. 8901030865404)"
            className="input-field flex-1"
            onKeyDown={e => e.key === 'Enter' && handleBarcodeScan()}
          />
          <button onClick={handleBarcodeScan} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <HiSearch /> Lookup
          </button>
        </div>
        {barcodeStatus && (
          <p className="text-sm mt-3 text-muted">{barcodeStatus}</p>
        )}
        <p className="text-xs text-muted mt-2">
          Try: 8901030865404 (iPhone), 8901030865411 (Samsung), 8901030865435 (Nike), 8901030865442 (Mixer)
        </p>
      </div>

      {/* Product Form */}
      <form onSubmit={handleSubmit} className="glass-card p-6 animate-fade-in-up stagger-1">
        <h2 className="text-lg font-semibold mb-4">Product Details</h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted block mb-1">Product Name *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="input-field" placeholder="e.g. iPhone 15 128GB" required />
          </div>

          <div>
            <label className="text-sm text-muted block mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="input-field !h-20 resize-none" placeholder="Brief product description" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted block mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="input-field cursor-pointer">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted block mb-1">Barcode</label>
              <input type="text" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })}
                className="input-field" placeholder="Product barcode" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted block mb-1">Selling Price (₹) *</label>
              <input type="number" value={form.price} onChange={e => updatePrice('price', e.target.value)}
                className="input-field" placeholder="e.g. 72999" required />
            </div>
            <div>
              <label className="text-sm text-muted block mb-1">MRP (₹) *</label>
              <input type="number" value={form.mrp} onChange={e => updatePrice('mrp', e.target.value)}
                className="input-field" placeholder="e.g. 79900" required />
            </div>
            <div>
              <label className="text-sm text-muted block mb-1">Discount (%)</label>
              <input type="number" value={form.discount} readOnly
                className="input-field !bg-surface cursor-not-allowed" />
              <span className="text-xs text-muted">Auto-calculated</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted block mb-1">Stock Quantity</label>
            <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
              className="input-field" />
          </div>

          {/* Product Photo Upload */}
          <div>
            <label className="text-sm text-muted block mb-2">Product Photo</label>
            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-card cursor-pointer transition-all group">
                <HiUpload className="text-3xl text-muted group-hover:text-primary-light transition-colors mb-2" />
                <span className="text-sm text-muted group-hover:text-primary-light transition-colors">Click to upload photo</span>
                <span className="text-xs text-muted mt-1">JPG, JPEG, PNG (max 5MB)</span>
                <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleImageSelect} className="hidden" />
              </label>
            ) : (
              <div className="relative inline-block">
                <img src={imagePreview} alt="Preview" className="w-40 h-40 rounded-xl object-cover border-2 border-border" />
                <button type="button" onClick={removeImage}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-danger text-white flex items-center justify-center text-sm hover:scale-110 transition-transform shadow-lg">
                  <HiX />
                </button>
                {uploading && (
                  <div className="absolute inset-0 bg-dark/60 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading || uploading} className="btn-primary w-full !py-3 text-center disabled:opacity-50 mt-4">
            {loading ? 'Adding Product...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
