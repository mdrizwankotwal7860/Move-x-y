import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCar, FaUserCircle, FaSignOutAlt, FaHistory, FaColumns } from 'react-icons/fa';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'driver') return '/driver';
    return '/dashboard';
  };

  return (
    <nav className="glass sticky top-0 z-50 px-4 py-3 md:px-8 flex justify-between items-center shadow-lg border-b border-white/5">
      <Link to="/" className="flex items-center space-x-2 text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500">
        <FaCar className="text-teal-400" />
        <span>Move X-Y</span>
      </Link>

      <div className="flex items-center space-x-4 md:space-x-6">
        {user ? (
          <>
            <Link
              to={getDashboardLink()}
              className="flex items-center space-x-1.5 text-slate-300 hover:text-teal-400 transition font-medium"
            >
              <FaColumns size={16} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            {(user.role === 'user' || user.role === 'rider') && (
              <Link
                to="/history"
                className="flex items-center space-x-1.5 text-slate-300 hover:text-teal-400 transition font-medium"
              >
                <FaHistory size={16} />
                <span className="hidden sm:inline">My Rides</span>
              </Link>
            )}

            {user.role === 'driver' && (
              <Link
                to="/driver/history"
                className="flex items-center space-x-1.5 text-slate-300 hover:text-teal-400 transition font-medium"
              >
                <FaHistory size={16} />
                <span className="hidden sm:inline">History</span>
              </Link>
            )}

            <div className="flex items-center space-x-3 pl-4 border-l border-white/10">
              <Link to={user.role === 'driver' ? '/driver' : user.role === 'admin' ? '/admin' : '/profile'} className="flex items-center space-x-2 group">
                <FaUserCircle size={22} className="text-teal-400 group-hover:text-teal-300 transition" />
                <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition max-w-[120px] truncate hidden md:inline">
                  {user.name}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 transition duration-200 rounded-lg hover:bg-white/5"
                title="Logout"
              >
                <FaSignOutAlt size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex space-x-3">
            <Link
              to="/login"
              className="px-4 py-1.5 text-slate-300 hover:text-white transition font-medium text-sm rounded-lg hover:bg-white/5"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-semibold rounded-lg shadow-md transition duration-200 text-sm"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
