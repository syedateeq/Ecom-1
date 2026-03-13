import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import { HiMail, HiLockClosed, HiUser, HiUserAdd } from 'react-icons/hi';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/user/signup', form);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="glass-card w-full max-w-md p-8 animate-fade-in-up">
        <div className="text-center mb-8">
          <HiUserAdd className="text-4xl text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-muted text-sm mt-1">Join SmartCart and start saving</p>
        </div>

        {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm p-3 rounded-xl mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted block mb-1">Full Name</label>
            <div className="relative">
              <HiUser className="absolute left-3 top-3.5 text-muted" />
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="input-field !pl-10" placeholder="Your name" required />
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
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3 text-center disabled:opacity-50">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
