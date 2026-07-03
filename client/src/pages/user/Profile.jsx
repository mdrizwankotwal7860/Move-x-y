import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaEnvelope, FaPhone, FaArrowLeft, FaCheck } from 'react-icons/fa';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const endpoint = user.role === 'driver' ? '/drivers/profile' : '/users/profile';
    try {
      const res = await api.put(endpoint, { name, phone });
      // Update local storage and auth context state
      const updatedUser = user.role === 'driver' ? res.data.driver : res.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setMessage('Profile updated successfully');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (user.role === 'driver') {
      navigate('/driver');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handleBack}
          className="p-2.5 bg-slate-900 border border-white/5 hover:bg-slate-800 rounded-lg text-slate-300 transition duration-150"
        >
          <FaArrowLeft size={14} />
        </button>
        <div>
          <h2 className="text-xl md:text-3xl font-black text-slate-100 uppercase tracking-tight">Edit Profile</h2>
          <p className="text-xs md:text-sm text-slate-400 font-medium">Keep your account communication detail records up to date</p>
        </div>
      </div>

      <div className="glass p-6 rounded-2xl border border-white/5 shadow-xl space-y-6">
        {message && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-semibold text-center flex items-center justify-center space-x-2">
            <FaCheck />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Readonly Role */}
          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Account Role</label>
            <input
              type="text"
              readOnly
              className="w-full px-4 py-3 bg-slate-900 border border-white/5 rounded-xl text-slate-400 text-sm uppercase tracking-wide cursor-not-allowed outline-none"
              value={user.role}
            />
          </div>

          {/* Readonly Email */}
          <div className="space-y-2">
            <label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <FaEnvelope size={13} />
              </span>
              <input
                type="email"
                readOnly
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/5 rounded-xl text-slate-400 text-sm cursor-not-allowed outline-none"
                value={user.email}
              />
            </div>
          </div>

          {/* Editable Name */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <FaUser size={13} />
              </span>
              <input
                type="text"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Editable Phone */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Phone Number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <FaPhone size={13} />
              </span>
              <input
                type="tel"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/5 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl shadow-lg transition duration-200 text-sm uppercase tracking-wider flex items-center justify-center space-x-2"
            disabled={loading}
          >
            {loading ? 'Saving updates...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
