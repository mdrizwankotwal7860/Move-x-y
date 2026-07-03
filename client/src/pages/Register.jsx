import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaUserTie, FaCheckCircle } from 'react-icons/fa';

export default function Register() {
  const [role, setRole] = useState('user'); // 'user' | 'driver'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { registerUser, registerDriver } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Simple client‑side validation before sending request
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      if (role === 'user') {
        await registerUser(name, email, password, phone);
        navigate('/dashboard');
      } else {
        await registerDriver(name, email, password, phone);
        setSuccess(true);
      }
    } catch (err) {
      console.error(err);
      // Extract server‑provided error message if available
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
        <div className="glass w-full max-w-md p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6 text-center">
          <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 shadow-inner">
            <FaCheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-100 uppercase tracking-wide">Awaiting Admin Approval</h2>
          <p className="text-slate-400 text-sm leading-relaxed font-medium">
            Your driver registration has been submitted successfully! An administrator must verify and approve your vehicle registration before you can receive booking requests.
          </p>
          <div className="pt-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg transition duration-200 text-sm uppercase tracking-wider"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-[80px] -z-10 animate-pulse"></div>

      <div className="glass w-full max-w-md p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-slate-100 uppercase tracking-wide">Get Started</h2>
          <p className="text-sm text-slate-400 font-medium">Create a free account to coordinate rides</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex bg-slate-900 p-1.5 rounded-xl border border-white/5">
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition duration-200 ${role === 'user' ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => setRole('user')}
          >
            I want a Ride
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition duration-200 ${role === 'driver' ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={() => setRole('driver')}
          >
            I want to Drive
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <FaUser size={14} />
              </span>
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

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
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Phone Number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <FaPhone size={14} />
              </span>
              <input
                type="tel"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
            disabled={loading || !name || !email || !password || !phone}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <FaUserTie />
                <span>Register as {role === 'user' ? 'Rider' : 'Driver'}</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-400 hover:text-teal-300 font-bold underline transition">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
