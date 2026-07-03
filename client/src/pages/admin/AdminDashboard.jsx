import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatsCard from '../../components/StatsCard';
import { FaUser, FaCar, FaRoute, FaCheckCircle, FaUserClock, FaTimesCircle, FaArrowRight } from 'react-icons/fa';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_users: 0,
    total_drivers: 0,
    total_rides: 0,
    pending_drivers: 0,
    active_rides: 0,
    completed_rides: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setStats(res.data.stats);
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-4xl font-black text-slate-100 uppercase tracking-tight">Admin System Terminal</h2>
        <p className="text-sm text-slate-400 font-medium">Review metrics, validate registrations, and inspect coordination ledger systems.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard
              title="Total Passengers"
              value={stats.total_users}
              icon={<FaUser size={20} />}
              description="Registered platform users"
              colorClass="text-teal-400"
            />
            <StatsCard
              title="Active Drivers"
              value={stats.total_drivers}
              icon={<FaCar size={20} />}
              description="Drivers registered in database"
              colorClass="text-emerald-400"
            />
            <StatsCard
              title="Total System Bookings"
              value={stats.total_rides}
              icon={<FaRoute size={20} />}
              description="All historically logged booking coordinates"
              colorClass="text-pink-400"
            />
            <StatsCard
              title="Pending Approvals"
              value={stats.pending_drivers}
              icon={<FaUserClock size={20} />}
              description="Registered drivers awaiting license validation"
              colorClass="text-yellow-400"
            />
            <StatsCard
              title="Active Coordinates"
              value={stats.active_rides}
              icon={<FaRoute size={20} className="animate-pulse" />}
              description="Rides in requested, accepted, or transit state"
              colorClass="text-blue-400"
            />
            <StatsCard
              title="Completed Trips"
              value={stats.completed_rides}
              icon={<FaCheckCircle size={20} />}
              description="Coordinated dropoffs successfully achieved"
              colorClass="text-purple-400"
            />
          </div>

          {/* Quick Management Shortcuts */}
          <div className="glass p-6 rounded-2xl border border-white/5 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-200">Management Cockpit Shortcuts</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/admin/users"
                className="glass-card p-4 rounded-xl border border-white/5 flex justify-between items-center hover:border-teal-500/20 transition-all group"
              >
                <div className="space-y-1">
                  <span className="font-bold text-slate-200 block text-sm">Passenger Registry</span>
                  <span className="text-[10px] text-slate-500 font-medium block">Inspect rider profiles</span>
                </div>
                <FaArrowRight size={12} className="text-slate-500 group-hover:text-teal-400 transition" />
              </Link>

              <Link
                to="/admin/drivers"
                className="glass-card p-4 rounded-xl border border-white/5 flex justify-between items-center hover:border-teal-500/20 transition-all group"
              >
                <div className="space-y-1">
                  <span className="font-bold text-slate-200 block text-sm">Driver Approvals</span>
                  <span className="text-[10px] text-slate-500 font-medium block">Approve/Reject vehicle applications</span>
                </div>
                <FaArrowRight size={12} className="text-slate-500 group-hover:text-teal-400 transition" />
              </Link>

              <Link
                to="/admin/rides"
                className="glass-card p-4 rounded-xl border border-white/5 flex justify-between items-center hover:border-teal-500/20 transition-all group"
              >
                <div className="space-y-1">
                  <span className="font-bold text-slate-200 block text-sm">Booking Ledger</span>
                  <span className="text-[10px] text-slate-500 font-medium block">System-wide coordinator record logs</span>
                </div>
                <FaArrowRight size={12} className="text-slate-500 group-hover:text-teal-400 transition" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
