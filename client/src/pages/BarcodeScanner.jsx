import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { HiQrcode, HiArrowLeft, HiSearch, HiPlus, HiCheck, HiPhotograph } from 'react-icons/hi';

export default function BarcodeScanner() {
  const { isRetailer } = useAuth();
  const [barcode, setBarcode] = useState('');
  const [scannedProduct, setScannedProduct] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [addForm, setAddForm] = useState({ price: '', stock: '10', image: '' });
  const [added, setAdded] = useState(false);

  const lookupBarcode = async () => {
    if (!barcode.trim()) return;
    setSearching(true);
    setError('');
    setScannedProduct(null);
    setAdded(false);
    try {
      const { data } = await API.get(`/retailer/barcode/${barcode.trim()}`);
      setScannedProduct(data);
      setAddForm({ price: String(data.mrp || ''), stock: '10', image: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Barcode not found. Please enter details manually.');
    } finally {
      setSearching(false);
    }
  };

  const addToInventory = async () => {
    if (!scannedProduct) return;
    try {
      await API.post('/retailer/products', {
        name: scannedProduct.name,
        description: scannedProduct.description || '',
        category: scannedProduct.category || 'General',
        barcode: barcode,
        image: addForm.image || 'https://via.placeholder.com/300x300?text=Product',
        price: parseFloat(addForm.price),
        mrp: scannedProduct.mrp,
        discount: Math.round((1 - parseFloat(addForm.price) / scannedProduct.mrp) * 100),
        stock: parseInt(addForm.stock) || 10,
      });
      setAdded(true);
    } catch (err) {
      setError('Failed to add product');
    }
  };

  const sampleBarcodes = [
    { code: '8901030865404', name: 'iPhone 15' },
    { code: '8901030865411', name: 'Samsung Galaxy S24' },
    { code: '8901030865428', name: 'Sony WH-1000XM5' },
    { code: '8901030865435', name: 'Nike Air Max 270' },
    { code: '8901030865442', name: 'Prestige Mixer' },
    { code: '0000000000000', name: 'Test Product' },
  ];

  return (
    <div className="min-h-screen py-8 px-4 max-w-4xl mx-auto">
      <Link to="/retailer/dashboard" className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary-light transition-colors mb-6">
        <HiArrowLeft /> Back to Dashboard
      </Link>

      <div className="text-center mb-10 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
          <HiQrcode className="text-primary-light text-xl" />
          <span className="text-primary-light font-semibold text-sm">Quick Product Entry</span>
        </div>
        <h1 className="text-3xl font-extrabold mb-2"><span className="gradient-text">Barcode</span> Scanner</h1>
        <p className="text-muted">Scan or enter a barcode to quickly add products to your inventory.</p>
      </div>

      {/* Scanner UI */}
      <div className="glass-card p-6 mb-8 animate-fade-in-up stagger-1">
        <div className="flex flex-col items-center gap-4">
          {/* Simulated Scanner Viewfinder */}
          <div className="w-full max-w-sm h-48 rounded-2xl bg-gradient-to-b from-card to-dark border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-3">
            <HiQrcode className="text-6xl text-primary/40 animate-pulse" />
            <p className="text-xs text-muted">Camera scanner will appear here</p>
            <p className="text-[10px] text-muted">(Use manual entry below for demo)</p>
          </div>

          {/* Manual Barcode Input */}
          <div className="w-full max-w-md">
            <label className="text-xs text-muted block mb-2">Enter Barcode Manually</label>
            <div className="flex gap-2">
              <input
                type="text" value={barcode} onChange={e => setBarcode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && lookupBarcode()}
                placeholder="e.g. 8901030865404"
                className="input-field flex-1"
              />
              <button onClick={lookupBarcode} disabled={searching} className="btn-primary flex items-center gap-1 !px-6">
                {searching ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><HiSearch /> Lookup</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Barcodes */}
      <div className="glass-card p-5 mb-8 animate-fade-in-up stagger-2">
        <p className="text-xs text-muted mb-3">Try these demo barcodes:</p>
        <div className="flex flex-wrap gap-2">
          {sampleBarcodes.map(b => (
            <button key={b.code} onClick={() => { setBarcode(b.code); }} className="px-3 py-1.5 rounded-full text-xs bg-card border border-border text-muted hover:border-primary hover:text-primary-light transition-all">
              {b.name} — <code className="text-primary-light">{b.code}</code>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-card p-4 mb-6 border-danger/30 text-danger text-sm text-center">{error}</div>
      )}

      {/* Scanned Result */}
      {scannedProduct && !added && (
        <div className="glass-card p-6 animate-fade-in-up">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><HiCheck className="text-secondary" /> Product Found</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div><span className="text-xs text-muted block">Name</span><span className="font-semibold">{scannedProduct.name}</span></div>
            <div><span className="text-xs text-muted block">Category</span><span className="font-semibold">{scannedProduct.category}</span></div>
            <div><span className="text-xs text-muted block">MRP</span><span className="font-semibold">₹{scannedProduct.mrp?.toLocaleString()}</span></div>
            <div><span className="text-xs text-muted block">Description</span><span className="font-semibold text-sm">{scannedProduct.description}</span></div>
          </div>
          <div className="border-t border-border/30 pt-4">
            <h4 className="text-sm font-semibold mb-3">Set Your Price & Stock</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs text-muted block mb-1">Selling Price (₹)</label>
                <input type="number" value={addForm.price} onChange={e => setAddForm({ ...addForm, price: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Stock Quantity</label>
                <input type="number" value={addForm.stock} onChange={e => setAddForm({ ...addForm, stock: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Image URL (optional)</label>
                <input type="text" value={addForm.image} onChange={e => setAddForm({ ...addForm, image: e.target.value })} placeholder="https://..." className="input-field" />
              </div>
            </div>
            <button onClick={addToInventory} className="btn-primary flex items-center gap-2 w-full justify-center !py-3">
              <HiPlus /> Add to Inventory
            </button>
          </div>
        </div>
      )}

      {/* Success */}
      {added && (
        <div className="glass-card p-8 text-center animate-fade-in-up">
          <HiCheck className="text-5xl text-secondary mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">Product Added!</h3>
          <p className="text-muted mb-6">{scannedProduct?.name} has been added to your inventory.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setBarcode(''); setScannedProduct(null); setAdded(false); }} className="btn-primary">Scan Another</button>
            <Link to="/retailer/products" className="btn-secondary">View Products</Link>
          </div>
        </div>
      )}
    </div>
  );
}
