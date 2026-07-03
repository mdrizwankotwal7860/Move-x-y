import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { FaCar, FaMapMarkerAlt, FaHistory, FaUser, FaRoute, FaArrowRight } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

export default function UserDashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/rides/user/history');
        setHistory(res.data.rides.slice(0, 3)); // show top 3 latest
      } catch (err) {
        console.error('Failed to load user rides:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'requested': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'accepted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'started': return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'cancelled': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-slate-100 uppercase tracking-tight">Rider Cockpit</h2>
          <p className="text-sm text-slate-400 font-medium">Welcome back, {user.name}. Ready to book a comfortable ride?</p>
        </div>
        <Link
          to="/book"
          className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl shadow-lg transition duration-200 text-sm uppercase tracking-wider flex items-center space-x-2"
        >
          <FaCar />
          <span>Book a Ride</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Quick Actions & Stats */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-white/5 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-200">Rider Profile</h3>
            <div className="flex items-center space-x-4">
              <div className="bg-teal-500/10 p-3.5 rounded-2xl text-teal-400 border border-teal-500/20">
                <FaUser size={24} />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-200 block leading-tight">{user.name}</span>
                <span className="text-xs text-slate-400 block">{user.email}</span>
                <span className="text-xs text-slate-400 block">{user.phone}</span>
              </div>
            </div>
            <div className="pt-2">
              <Link
                to="/profile"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold border border-white/5 rounded-xl transition duration-200 text-xs uppercase tracking-wider block text-center"
              >
                Edit Profile
              </Link>
            </div>
          </div>

          {/* Quick Info card */}
          <div className="glass p-6 rounded-2xl border border-white/5 shadow-xl bg-gradient-to-br from-slate-900/50 to-teal-950/20 space-y-3">
            <h3 className="text-base font-bold text-slate-200">How to book a ride:</h3>
            <ul className="text-xs text-slate-400 space-y-2 font-medium">
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                <span>Click the <b>Book a Ride</b> button.</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                <span>Select pickup and drop-off points on map.</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                <span>Get estimated price and request ride.</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                <span>Live track your driver's arrival real-time!</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Latest Rides */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-white/5 shadow-xl space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-white/5">
            <h3 className="text-lg font-bold text-slate-200 flex items-center space-x-2">
              <FaHistory size={16} className="text-teal-400" />
              <span>Recent Rides</span>
            </h3>
            {history.length > 0 && (
              <Link to="/history" className="text-xs font-bold text-teal-400 hover:underline flex items-center space-x-1 uppercase">
                <span>View All</span>
                <FaArrowRight size={10} />
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-slate-600 text-5xl">🚗</div>
              <p className="text-slate-400 text-sm font-semibold">You haven't booked any rides yet!</p>
              <Link
                to="/book"
                className="inline-block px-5 py-2.5 bg-teal-500 text-slate-950 text-xs font-bold rounded-lg uppercase tracking-wider shadow hover:bg-teal-400 transition"
              >
                Book Your First Ride
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((ride) => (
                <div key={ride.id} className="glass-card p-4 rounded-xl border border-white/5 space-y-3.5 hover:scale-[1.005] transition-all">
                  <div className="flex justify-between items-start">
                    <span className="text-xs text-slate-500 font-bold">#{ride.id.slice(-6).toUpperCase()}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getStatusColor(ride.status)}`}>
                      {ride.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-medium">
                    <div className="flex items-start space-x-2">
                      <FaMapMarkerAlt className="text-teal-400 mt-0.5 shrink-0" size={11} />
                      <p className="text-slate-300 line-clamp-1">{ride.pickup.address}</p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <FaMapMarkerAlt className="text-pink-400 mt-0.5 shrink-0" size={11} />
                      <p className="text-slate-300 line-clamp-1">{ride.destination.address}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/5 text-xs">
                    <div className="flex space-x-4 text-slate-400">
                      <span><b>Distance:</b> {ride.distance_km} km</span>
                      {ride.driver_name && <span><b>Driver:</b> {ride.driver_name}</span>}
                    </div>
                    <span className="font-extrabold text-teal-400 text-sm">₹{ride.fare}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
