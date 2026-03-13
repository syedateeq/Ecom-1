import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { HiMail, HiLockClosed, HiUser, HiOfficeBuilding, HiLocationMarker, HiPhone } from 'react-icons/hi';

export default function RetailerSignup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', shopName: '', shopAddress: '', phone: '', category: 'General' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const categories = ['Electronics', 'Fashion', 'Footwear', 'Kitchen', 'Books', 'General'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/retailer/signup', form);
      login(data.token, data.user);
      navigate('/retailer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="glass-card w-full max-w-lg p-8 animate-fade-in-up">
        <div className="text-center mb-8">
          <HiOfficeBuilding className="text-4xl text-secondary mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Register Your Shop</h1>
          <p className="text-muted text-sm mt-1">Join SmartCart and reach nearby customers</p>
        </div>

        {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm p-3 rounded-xl mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted block mb-1">Your Name</label>
              <div className="relative">
                <HiUser className="absolute left-3 top-3.5 text-muted" />
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input-field !pl-10" placeholder="Your name" required />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted block mb-1">Shop Name</label>
              <div className="relative">
                <HiOfficeBuilding className="absolute left-3 top-3.5 text-muted" />
                <input type="text" value={form.shopName} onChange={e => setForm({ ...form, shopName: e.target.value })}
                  className="input-field !pl-10" placeholder="Your shop name" required />
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted block mb-1">Email</label>
            <div className="relative">
              <HiMail className="absolute left-3 top-3.5 text-muted" />
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-field !pl-10" placeholder="your@email.com" required />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted block mb-1">Password</label>
            <div className="relative">
              <HiLockClosed className="absolute left-3 top-3.5 text-muted" />
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-field !pl-10" placeholder="Choose a password" required minLength={6} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted block mb-1">Shop Address</label>
              <div className="relative">
                <HiLocationMarker className="absolute left-3 top-3.5 text-muted" />
                <input type="text" value={form.shopAddress} onChange={e => setForm({ ...form, shopAddress: e.target.value })}
                  className="input-field !pl-10" placeholder="Shop address" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted block mb-1">Phone</label>
              <div className="relative">
                <HiPhone className="absolute left-3 top-3.5 text-muted" />
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="input-field !pl-10" placeholder="Phone number" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted block mb-1">Shop Category</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="input-field cursor-pointer">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3 text-center disabled:opacity-50">
            {loading ? 'Registering...' : 'Register Shop'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already registered? <Link to="/retailer/login" className="text-secondary hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
