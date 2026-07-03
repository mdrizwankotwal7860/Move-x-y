import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { FaUser, FaArrowLeft, FaCalendarAlt } from 'react-icons/fa';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data.users);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
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
            <FaUser className="text-teal-400" />
            <span>Passenger Registry</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-medium">Verify and inspect registered passenger profiles and account timelines</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="glass p-12 text-center rounded-2xl border border-white/5 shadow-xl">
          <p className="text-slate-400 text-sm font-semibold">No registered platform passengers found.</p>
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
                  <th className="px-6 py-4">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium text-slate-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-200">{u.name}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">{u.phone}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 flex items-center space-x-1.5">
                      <FaCalendarAlt />
                      <span>{formatDate(u.created_at)}</span>
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
