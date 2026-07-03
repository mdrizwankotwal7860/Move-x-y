import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaLock, FaSignInAlt, FaCar } from 'react-icons/fa';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      // Redirect based on role
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else if (loggedUser.role === 'driver') {
        navigate('/driver');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[80px] -z-10 animate-pulse"></div>

      <div className="glass w-full max-w-md p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20 shadow-inner">
            <FaCar size={24} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-100 uppercase tracking-wide">Welcome Back</h2>
          <p className="text-sm text-slate-400 font-medium">Access your personal ride booking dashboard</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <FaEnvelope size={14} />
              </span>
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <FaLock size={14} />
              </span>
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl shadow-lg transition duration-200 text-sm flex items-center justify-center space-x-2 tracking-wider uppercase"
            disabled={loading}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <FaSignInAlt />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-teal-400 hover:text-teal-300 font-bold underline transition">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
