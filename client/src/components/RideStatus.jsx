import React from 'react';
import { FaCar, FaMapMarkerAlt, FaUser, FaPhone, FaCompass } from 'react-icons/fa';

export default function RideStatus({ ride, onCancel }) {
  if (!ride) return null;

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

  const getStepActive = (step) => {
    const sequence = ['requested', 'accepted', 'started', 'completed'];
    const currentIndex = sequence.indexOf(ride.status);
    const stepIndex = sequence.indexOf(step);
    if (ride.status === 'cancelled') return 'bg-rose-500/20 border-rose-500/30 text-rose-500';
    return stepIndex <= currentIndex ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 border-slate-700 text-slate-500';
  };

  return (
    <div className="glass p-6 rounded-xl border border-white/5 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-white/5">
        <div>
          <h3 className="text-lg font-bold text-slate-200">Ride Status</h3>
          <p className="text-xs text-slate-400 mt-1">ID: #{ride.id.slice(-6).toUpperCase()}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(ride.status)}`}>
          {ride.status}
        </span>
      </div>

      {/* Booking Tracker Steps */}
      {ride.status !== 'cancelled' && (
        <div className="relative flex justify-between items-center max-w-md mx-auto py-2">
          {/* Progress bar line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 -z-10"></div>
          
          <div className="flex flex-col items-center space-y-1.5 z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getStepActive('requested')}`}>1</div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Booked</span>
          </div>

          <div className="flex flex-col items-center space-y-1.5 z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getStepActive('accepted')}`}>2</div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Accepted</span>
          </div>

          <div className="flex flex-col items-center space-y-1.5 z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getStepActive('started')}`}>3</div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">On Ride</span>
          </div>

          <div className="flex flex-col items-center space-y-1.5 z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getStepActive('completed')}`}>4</div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Arrived</span>
          </div>
        </div>
      )}

      {/* Driver info card */}
      {ride.driver_id && (
        <div className="glass-card p-4 rounded-lg flex items-center justify-between border border-white/5">
          <div className="flex items-center space-x-3.5">
            <div className="bg-teal-500/10 p-2.5 rounded-full text-teal-400">
              <FaUser size={20} />
            </div>
            <div>
              <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Your Driver</span>
              <span className="text-base font-bold text-slate-200">{ride.driver_name || 'Driver Assigned'}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <a
              href={`tel:${ride.driver_phone || '9876543210'}`}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-lg transition duration-200"
              title="Call Driver"
            >
              <FaPhone size={14} />
            </a>
          </div>
        </div>
      )}

      {/* Status Specific Description */}
      <div className="space-y-4">
        {ride.status === 'requested' && (
          <div className="text-center py-4 bg-teal-500/5 rounded-lg border border-teal-500/10 flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-teal-400">Searching for nearby available drivers...</p>
          </div>
        )}

        {ride.status === 'accepted' && (
          <div className="flex items-center space-x-2 text-blue-400 text-sm font-semibold justify-center py-2 bg-blue-500/5 rounded-lg border border-blue-500/10">
            <FaCompass className="animate-spin" />
            <span>Driver is on the way to pick you up.</span>
          </div>
        )}

        {ride.status === 'started' && (
          <div className="flex items-center space-x-2 text-teal-400 text-sm font-semibold justify-center py-2 bg-teal-500/5 rounded-lg border border-teal-500/10">
            <FaCar className="animate-pulse" />
            <span>In transit. Enjoy your ride!</span>
          </div>
        )}
      </div>

      {/* Ride Summary Info */}
      <div className="space-y-3.5 text-sm">
        <div className="flex items-start space-x-2">
          <FaMapMarkerAlt className="text-teal-400 mt-1 shrink-0" size={14} />
          <div>
            <span className="text-xs text-slate-400 font-bold block">PICKUP</span>
            <span className="text-slate-200 line-clamp-1">{ride.pickup?.address}</span>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <FaMapMarkerAlt className="text-pink-400 mt-1 shrink-0" size={14} />
          <div>
            <span className="text-xs text-slate-400 font-bold block">DESTINATION</span>
            <span className="text-slate-200 line-clamp-1">{ride.destination?.address}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5">
          <div className="bg-slate-900/40 p-2.5 rounded-lg text-center border border-white/5">
            <span className="text-xs text-slate-400 block font-semibold mb-0.5">Fare Estimate</span>
            <span className="text-lg font-black text-teal-400">₹{ride.fare}</span>
          </div>
          <div className="bg-slate-900/40 p-2.5 rounded-lg text-center border border-white/5">
            <span className="text-xs text-slate-400 block font-semibold mb-0.5">Distance</span>
            <span className="text-lg font-black text-slate-200">{ride.distance_km} km</span>
          </div>
        </div>
      </div>

      {/* Cancel button */}
      {['requested', 'accepted'].includes(ride.status) && (
        <button
          onClick={() => onCancel(ride.id)}
          className="w-full py-2.5 bg-rose-500/15 hover:bg-rose-500 text-rose-400 hover:text-slate-950 font-bold rounded-lg border border-rose-500/20 transition duration-200 text-sm"
        >
          Cancel Ride
        </button>
      )}
    </div>
  );
}
