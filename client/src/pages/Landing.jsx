import React from 'react';
import { Link } from 'react-router-dom';
import { FaCar, FaShieldAlt, FaClock, FaMapMarkedAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-between">
      {/* Hero Section */}
      <section className="relative px-4 py-20 md:py-32 flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
        {/* Decorative ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-teal-500/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-teal-400 uppercase tracking-widest animate-fade-in shadow-md">
          <FaCar />
          <span>Next Gen Ride Booking</span>
        </div>

        <h1 className="text-4xl md:text-7xl font-black tracking-tight text-slate-100 uppercase">
          Your Ride, <br className="md:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500">
            Reimagined.
          </span>
        </h1>

        <p className="text-base md:text-xl text-slate-400 max-w-2xl font-medium leading-relaxed">
          Book reliable rides in seconds with live tracking, pre-calculated estimates, and professional verified drivers. An academic presentation project demonstrating high-fidelity real-time coordination.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
          {user ? (
            <Link
              to={user.role === 'admin' ? '/admin' : user.role === 'driver' ? '/driver' : '/dashboard'}
              className="px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-[1.03] uppercase tracking-wider text-sm"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black rounded-2xl shadow-xl transition-all duration-300 transform hover:scale-[1.03] uppercase tracking-wider text-sm"
              >
                Book a Ride Now
              </Link>
              <Link
                to="/register"
                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 transform hover:scale-[1.03] uppercase tracking-wider text-sm"
              >
                Become a Driver
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 md:px-8 border-t border-white/5 bg-slate-900/20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass p-8 rounded-2xl border border-white/5 flex flex-col space-y-4 shadow-lg hover:border-teal-500/20 transition-colors duration-300">
            <div className="p-3 bg-teal-500/10 text-teal-400 w-fit rounded-xl border border-teal-500/20 shadow-inner">
              <FaMapMarkedAlt size={22} />
            </div>
            <h3 className="text-xl font-bold text-slate-200">Interactive Map picker</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Click anywhere on our OpenStreetMap interface to place pickup and drop points instantly. Address geocoding triggers automatically.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass p-8 rounded-2xl border border-white/5 flex flex-col space-y-4 shadow-lg hover:border-teal-500/20 transition-colors duration-300">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 w-fit rounded-xl border border-emerald-500/20 shadow-inner">
              <FaShieldAlt size={22} />
            </div>
            <h3 className="text-xl font-bold text-slate-200">Verified Drivers</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Every driver undergoes complete vehicle and registration validation through our admin dashboard interface before receiving ride offers.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass p-8 rounded-2xl border border-white/5 flex flex-col space-y-4 shadow-lg hover:border-teal-500/20 transition-colors duration-300">
            <div className="p-3 bg-teal-500/10 text-teal-400 w-fit rounded-xl border border-teal-500/20 shadow-inner">
              <FaClock size={22} />
            </div>
            <h3 className="text-xl font-bold text-slate-200">Real-Time Syncing</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Socket.IO synchronization coordinates user dashboards and driver terminals instantly. Zero polling means instant notifications.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500 font-medium">
        <p>&copy; {new Date().getFullYear()} AntigravityCabs Ride Booking System. Developed for MCA/BCA Project Presentation.</p>
      </footer>
    </div>
  );
}
