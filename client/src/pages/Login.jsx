import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { HiMail, HiLockClosed, HiUser } from 'react-icons/hi';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/user/login', form);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="glass-card w-full max-w-md p-8 animate-fade-in-up">
        <div className="text-center mb-8">
          <HiUser className="text-4xl text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-muted text-sm mt-1">Login to your account</p>
        </div>

        {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm p-3 rounded-xl mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted block mb-1">Email</label>
            <div className="relative">
              <HiMail className="absolute left-3 top-3.5 text-muted" />
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-field !pl-10" placeholder="user@demo.com" required />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted block mb-1">Password</label>
            <div className="relative">
              <HiLockClosed className="absolute left-3 top-3.5 text-muted" />
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-field !pl-10" placeholder="password123" required />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3 text-center disabled:opacity-50">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign Up</Link>
        </p>
        <p className="text-center text-xs text-muted mt-2">
          Are you a retailer? <Link to="/retailer/login" className="text-secondary hover:underline">Retailer Login</Link>
        </p>
        <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted text-center">
          Demo: <strong>user@demo.com</strong> / <strong>password123</strong>
        </div>
      </div>
    </div>
  );
}
