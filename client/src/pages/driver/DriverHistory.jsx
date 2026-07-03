import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { FaHistory, FaMapMarkerAlt, FaCalendarAlt, FaUser, FaArrowLeft } from 'react-icons/fa';

export default function DriverHistory() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/rides/driver/history');
        setRides(res.data.rides);
      } catch (err) {
        console.error('Failed to load driver rides history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'cancelled': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/driver')}
          className="p-2.5 bg-slate-900 border border-white/5 hover:bg-slate-800 rounded-lg text-slate-300 transition duration-150"
        >
          <FaArrowLeft size={14} />
        </button>
        <div>
          <h2 className="text-xl md:text-3xl font-black text-slate-100 uppercase tracking-tight flex items-center space-x-2">
            <FaHistory className="text-teal-400" />
            <span>Driver Trip History</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-medium">Review your historical driver coordinated bookings</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      ) : rides.length === 0 ? (
        <div className="glass p-12 text-center rounded-2xl border border-white/5 shadow-xl space-y-4">
          <div className="text-6xl text-slate-700">📜</div>
          <p className="text-slate-400 text-sm font-semibold">You don't have any trip records inside this account.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rides.map((ride) => (
            <div key={ride.id} className="glass p-5 rounded-2xl border border-white/5 shadow-xl space-y-4 hover:scale-[1.002] transition-all">
              {/* Header */}
              <div className="flex justify-between items-center text-xs pb-3 border-b border-white/5">
                <div className="flex items-center space-x-2 text-slate-400 font-semibold">
                  <FaCalendarAlt />
                  <span>{formatDate(ride.created_at)}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase border ${getStatusColor(ride.status)}`}>
                  {ride.status}
                </span>
              </div>

              {/* Coordinates */}
              <div className="space-y-3 text-xs font-medium">
                <div className="flex items-start space-x-2.5">
                  <FaMapMarkerAlt className="text-teal-400 mt-0.5 shrink-0" size={13} />
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-0.5">PICKUP</span>
                    <p className="text-slate-300 leading-normal">{ride.pickup.address}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5">
                  <FaMapMarkerAlt className="text-pink-400 mt-0.5 shrink-0" size={13} />
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-0.5">DROP</span>
                    <p className="text-slate-300 leading-normal">{ride.destination.address}</p>
                  </div>
                </div>
              </div>

              {/* Footer pricing */}
              <div className="flex justify-between items-center pt-3.5 border-t border-white/5 text-xs">
                <div className="flex space-x-4 text-slate-400">
                  <span><b>Distance:</b> {ride.distance_km} km</span>
                  <span className="flex items-center space-x-1">
                    <FaUser className="text-slate-500" />
                    <span><b>Passenger:</b> {ride.user_name}</span>
                  </span>
                </div>
                <span className="font-extrabold text-teal-400 text-sm">₹{ride.fare}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
