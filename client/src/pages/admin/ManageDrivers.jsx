import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { FaCar, FaArrowLeft, FaCheck, FaTimes, FaCircle } from 'react-icons/fa';

export default function ManageDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/admin/drivers');
      setDrivers(res.data.drivers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleApprove = async (driverId) => {
    try {
      await api.put(`/admin/drivers/${driverId}/approve`);
      alert('Driver approved successfully');
      fetchDrivers();
    } catch (err) {
      console.error(err);
      alert('Failed to approve driver');
    }
  };

  const handleReject = async (driverId) => {
    try {
      await api.put(`/admin/drivers/${driverId}/reject`);
      alert('Driver rejected');
      fetchDrivers();
    } catch (err) {
      console.error(err);
      alert('Failed to reject driver');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/admin')}
          className="p-2.5 bg-slate-900 border border-white/5 hover:bg-slate-800 rounded-lg text-slate-300 transition duration-150"
        >
          <FaArrowLeft size={14} />
        </button>
        <div>
          <h2 className="text-xl md:text-3xl font-black text-slate-100 uppercase tracking-tight flex items-center space-x-2">
            <FaCar className="text-teal-400" />
            <span>Driver Registry & Approvals</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-medium">Approve newly registered accounts and coordinate license credentials</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      ) : drivers.length === 0 ? (
        <div className="glass p-12 text-center rounded-2xl border border-white/5 shadow-xl">
          <p className="text-slate-400 text-sm font-semibold">No registered platform drivers found.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-white/5 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4 text-center">App Status</th>
                  <th className="px-6 py-4 text-center">Docs Status</th>
                  <th className="px-6 py-4 text-center">Live Sync</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-slate-300">
                {drivers.map((d) => (
                  <tr key={d.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-200">{d.name}</td>
                    <td className="px-6 py-4">{d.email}</td>
                    <td className="px-6 py-4">{d.phone}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${d.is_approved ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                        {d.is_approved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                        d.docs_verification_status === 'verified' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 
                        d.docs_verification_status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 
                        'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}>
                        {d.docs_verification_status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${d.is_online ? 'text-teal-400' : 'text-slate-500'}`}>
                        <FaCircle className={`w-1.5 h-1.5 animate-pulse ${d.is_online ? 'text-teal-400' : 'text-slate-600'}`} />
                        <span>{d.is_online ? 'Online' : 'Offline'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/drivers/${d.id}/documents`)}
                          className="px-3 py-1.5 bg-slate-800 text-teal-400 font-bold border border-white/5 rounded-lg hover:bg-slate-700 transition text-[10px] uppercase tracking-wider"
                        >
                          View Docs
                        </button>
                        {!d.is_approved ? (
                          <button
                            onClick={() => handleApprove(d.id)}
                            className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400 transition text-xs flex items-center gap-1"
                          >
                            <FaCheck size={10} />
                            <span>Approve</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReject(d.id)}
                            className="px-3 py-1.5 bg-slate-900 border border-white/5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-slate-800 transition text-xs flex items-center gap-1"
                          >
                            <FaTimes size={10} />
                            <span>Revoke</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
