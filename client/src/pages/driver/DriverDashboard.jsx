import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { FaCar, FaMapMarkerAlt, FaToggleOn, FaToggleOff, FaUser, FaRoute, FaCompass, FaChevronRight } from 'react-icons/fa';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [rating, setRating] = useState({ avg_rating: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  
  const [incomingRequest, setIncomingRequest] = useState(null); // live ride request modal
  const [activeRide, setActiveRide] = useState(null); // currently executing ride
  const [otpInput, setOtpInput] = useState(''); // OTP entered by driver

  
  const socket = useSocket();
  const navigate = useNavigate();

  // Load driver profile, vehicle, and ratings
  const loadDriverData = async () => {
    try {
      const res = await api.get('/drivers/profile');
      setProfile(res.data.driver);
      setVehicle(res.data.vehicle);
      setRating(res.data.rating);
      setIsOnline(res.data.driver.is_online);

      // Check if driver has an active coordinate ride in history
      const historyRes = await api.get('/rides/driver/history');
      const active = historyRes.data.rides.find(r => ['accepted', 'started'].includes(r.status));
      if (active) {
        setActiveRide(active);
      }
    } catch (err) {
      console.error('Failed to load driver profile details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriverData();
  }, []);

  // Listen to Socket.IO for new booking coordinates and updates
  useEffect(() => {
    if (!socket) return;

    socket.on('ride_requested', (ride) => {
      console.log('[Socket] Incoming ride request:', ride);
      // Only display incoming request if not already on an active ride
      if (!activeRide) {
        setIncomingRequest(ride);
      }
    });

    socket.on('ride_cancelled', () => {
      console.log('[Socket] Current ride cancelled');
      setActiveRide(null);
      setIncomingRequest(null);
      alert('The current ride was cancelled by the rider.');
    });

    socket.on('ride_withdrawn', (data) => {
      console.log('[Socket] Ride offer withdrawn:', data);
      setIncomingRequest(null);
    });

    return () => {
      socket.off('ride_requested');
      socket.off('ride_cancelled');
      socket.off('ride_withdrawn');
    };
  }, [socket, activeRide]);

  // Periodic driver GPS location update simulator
  useEffect(() => {
    if (!isOnline) return;

    let currentLat = activeRide ? activeRide.pickup.lat : (profile?.current_location?.lat || 12.9716);
    let currentLng = activeRide ? activeRide.pickup.lng : (profile?.current_location?.lng || 77.5946);

    const interval = setInterval(() => {
      if (activeRide) {
        // Simulate location movements towards destination coordinates
        const step = 0.0005;
        const targetLat = activeRide.destination.lat;
        const targetLng = activeRide.destination.lng;

        if (currentLat < targetLat) currentLat += step;
        else currentLat -= step;

        if (currentLng < targetLng) currentLng += step;
        else currentLng -= step;
      } else {
        // Idle driver: simulate slight GPS drift
        currentLat += (Math.random() - 0.5) * 0.0001;
        currentLng += (Math.random() - 0.5) * 0.0001;
      }

      // Update location on API
      api.put('/drivers/location', { lat: currentLat, lng: currentLng });

      // Emit live coordinates updates to server/user room if on active ride
      if (activeRide && socket) {
        socket.emit('location_update', {
          driver_id: user.id,
          ride_id: activeRide.id,
          lat: currentLat,
          lng: currentLng,
          user_id: activeRide.user_id,
          ride_status: activeRide.status,
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isOnline, activeRide, socket, profile]);

  const handleToggleOnline = async () => {
    try {
      const nextOnlineState = !isOnline;
      await api.put('/drivers/status', { is_online: nextOnlineState });
      setIsOnline(nextOnlineState);
      
      // Update local storage
      const updatedUser = { ...user, is_online: nextOnlineState };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error(err);
      alert('Failed to change online status');
    }
  };

  const handleAcceptRide = async (rideId) => {
    try {
      const res = await api.put(`/rides/${rideId}/accept`);
      setActiveRide(res.data.ride);
      setIncomingRequest(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to accept ride');
      setIncomingRequest(null);
    }
  };

  const handleRejectRide = async (rideId) => {
    try {
      await api.put(`/rides/${rideId}/reject`);
      setIncomingRequest(null);
    } catch (err) {
      console.error(err);
      setIncomingRequest(null);
    }
  };

  const handleVerifyOtp = async (rideId) => {
    if (!otpInput || otpInput.length !== 4) {
      alert('Please enter a 4-digit OTP');
      return;
    }
    try {
      await api.put(`/rides/${rideId}/verify-otp`, { otp: otpInput });
      setActiveRide((prev) => ({ ...prev, otp_verified: true }));
      setOtpInput('');
      alert('OTP Verified! You can now start the ride.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Invalid OTP');
    }
  };

  const handleStartRide = async (rideId) => {
    try {
      const res = await api.put(`/rides/${rideId}/start`);
      setActiveRide(res.data.ride);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to start ride');
    }
  };

  const handleCompleteRide = async (rideId) => {
    try {
      await api.put(`/rides/${rideId}/complete`);
      setActiveRide(null);
      alert('Ride completed successfully! Finding new riders...');
      loadDriverData(); // reload stats
    } catch (err) {
      console.error(err);
      alert('Failed to complete ride');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  // Handle ghost sessions (token exists but driver was wiped from database)
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 px-4 text-center space-y-6">
        <div className="text-6xl">⚠️</div>
        <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide">Session Expired</h2>
        <p className="text-slate-400 text-sm max-w-md">Your driver account data could not be found (the temporary development database may have restarted). Please log in or register again.</p>
        <button
          onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }}
          className="px-8 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl shadow-lg transition"
        >
          Return to Login
        </button>
      </div>
    );
  }

  // Not approved check
  if (!profile.is_approved) {
    const docStatus = profile.docs_verification_status || 'not_uploaded';
    const needsDocs = ['not_uploaded', 'rejected'].includes(docStatus);

    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="glass p-8 rounded-2xl border border-white/5 shadow-2xl text-center space-y-6">
          <div className="text-5xl">🕒</div>
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide">Approval Pending</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            {needsDocs 
              ? "You must upload your required documents (or fix rejected ones) before your account can be approved."
              : "Your profile and documents are awaiting validation by administrators."}
          </p>
          <Link
            to="/driver/documents"
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg transition duration-200 text-sm uppercase block"
          >
            {needsDocs ? "Upload Documents" : "View Documents"}
          </Link>
        </div>
      </div>
    );
  }

  // No vehicle check
  if (profile && profile.is_approved && !vehicle) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="glass p-8 rounded-2xl border border-white/5 shadow-2xl text-center space-y-6">
          <div className="text-5xl text-teal-400">🚗</div>
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide">Register Vehicle</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            You must add your vehicle registration details (plate number, color, model) before taking passenger requests.
          </p>
          <Link
            to="/driver/register"
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg transition duration-200 text-sm uppercase block"
          >
            Add Vehicle Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome & Online Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-slate-100 uppercase tracking-tight">Driver Terminal</h2>
          <p className="text-sm text-slate-400 font-medium">Welcome back, {user.name}. Coordinate bookings with passenger live syncs.</p>
        </div>
        <button
          onClick={handleToggleOnline}
          className={`px-6 py-3 rounded-xl border font-bold text-sm uppercase tracking-wider flex items-center space-x-2.5 transition-all duration-300 shadow-md ${isOnline ? 'bg-teal-500 text-slate-950 border-teal-400' : 'bg-slate-900 text-slate-400 border-white/5 hover:border-white/10'}`}
        >
          {isOnline ? (
            <>
              <FaToggleOn size={18} />
              <span>Go Offline</span>
            </>
          ) : (
            <>
              <FaToggleOff size={18} />
              <span>Go Online</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left column driver stats */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-white/5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-300 border-b border-white/5 pb-2">Vehicle & Ratings</h3>
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20 shadow-inner shrink-0">
                <FaCar size={20} />
              </div>
              <div className="space-y-0.5 text-sm">
                <span className="font-bold text-slate-200 block">{vehicle.make} {vehicle.model}</span>
                <span className="text-[10px] text-teal-400 uppercase font-black tracking-wider block bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 w-fit">{vehicle.plate_number}</span>
                <span className="text-xs text-slate-400 block pt-1">Type: {vehicle.vehicle_type} • {vehicle.color}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5 text-center">
              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Rating</span>
                <span className="text-lg font-black text-slate-200">★ {rating.avg_rating || '5.0'}</span>
              </div>
              <div className="bg-slate-900/40 p-2.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Trips</span>
                <span className="text-lg font-black text-slate-200">{rating.count || '0'}</span>
              </div>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl border border-white/5 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-300">Terminal Control</h3>
            <div className="space-y-2">
              <Link
                to="/driver/documents"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold border border-white/5 rounded-xl transition duration-200 text-xs uppercase tracking-wider block text-center"
              >
                Manage Documents
              </Link>
              <Link
                to="/driver/history"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold border border-white/5 rounded-xl transition duration-200 text-xs uppercase tracking-wider block text-center"
              >
                View completed Trips
              </Link>
              <Link
                to="/profile"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold border border-white/5 rounded-xl transition duration-200 text-xs uppercase tracking-wider block text-center"
              >
                Update Profile Info
              </Link>
            </div>
          </div>
        </div>

        {/* Right column active ride tracker */}
        <div className="lg:col-span-2 space-y-6">
          {!isOnline && !activeRide && (
            <div className="glass p-8 text-center rounded-2xl border border-white/5 shadow-xl space-y-4">
              <div className="text-5xl text-slate-700">💤</div>
              <p className="text-slate-400 text-sm font-semibold">You are currently offline.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-normal">Toggle your online status on the top right to become eligible for incoming ride booking requests.</p>
            </div>
          )}

          {isOnline && !activeRide && (
            <div className="glass p-8 text-center rounded-2xl border border-white/5 shadow-xl space-y-6">
              <div className="relative inline-flex items-center justify-center p-3 bg-teal-500/10 text-teal-400 rounded-full border border-teal-500/20">
                <FaCompass size={32} className="animate-spin duration-3000" />
              </div>
              <div className="space-y-2">
                <p className="text-slate-300 font-bold">Scanning for incoming passenger bookings...</p>
                <p className="text-xs text-slate-500">Coordinate mapping system is active. Pending rides will automatically appear here as popups.</p>
              </div>
              <Link
                to="/driver/requests"
                className="inline-flex items-center space-x-2 text-xs font-bold text-teal-400 hover:underline uppercase"
              >
                <span>View all pending requests</span>
                <FaChevronRight size={10} />
              </Link>
            </div>
          )}

          {activeRide && (
            <div className="glass p-6 rounded-2xl border border-white/5 shadow-xl space-y-6 bg-gradient-to-br from-slate-900 to-teal-950/20">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <div>
                  <h3 className="text-lg font-bold text-slate-200 uppercase">Active Coordinate Ride</h3>
                  <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider mt-0.5">Passenger: {activeRide.user_name || 'Passenger'}</span>
                </div>
                <span className="px-3 py-1 rounded bg-teal-500 text-slate-950 font-black text-xs uppercase border border-teal-400 animate-pulse">
                  {activeRide.status}
                </span>
              </div>

              {/* Addresses */}
              <div className="space-y-4 text-sm font-medium">
                <div className="flex items-start space-x-2.5">
                  <FaMapMarkerAlt className="text-teal-400 mt-1 shrink-0" size={14} />
                  <div>
                    <span className="text-xs text-slate-400 block font-bold">PICKUP FROM</span>
                    <p className="text-slate-300">{activeRide.pickup.address}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2.5">
                  <FaMapMarkerAlt className="text-pink-400 mt-1 shrink-0" size={14} />
                  <div>
                    <span className="text-xs text-slate-400 block font-bold">DROPOFF TO</span>
                    <p className="text-slate-300">{activeRide.destination.address}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5">
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-white/5 text-center">
                  <span className="text-xs text-slate-400 block font-semibold mb-0.5">Collect Fare</span>
                  <span className="text-lg font-black text-teal-400">₹{activeRide.fare}</span>
                </div>
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-white/5 text-center">
                  <span className="text-xs text-slate-400 block font-semibold mb-0.5">Distance</span>
                  <span className="text-lg font-black text-slate-200">{activeRide.distance_km} km</span>
                </div>
              </div>

              {/* Status Actions */}
              <div className="pt-2 space-y-3">
                {activeRide.status === 'accepted' && !activeRide.otp_verified && (
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-3">
                    <p className="text-xs text-slate-400 font-semibold text-center uppercase tracking-widest">Verify Ride OTP</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength="4"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        placeholder="4-digit OTP"
                        className="w-full text-center tracking-[0.5em] text-lg font-bold bg-slate-950 border border-white/10 rounded-lg outline-none focus:border-teal-500 text-white py-2"
                      />
                      <button
                        onClick={() => handleVerifyOtp(activeRide.id)}
                        className="px-6 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-lg transition"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                )}
                {activeRide.status === 'accepted' && activeRide.otp_verified && (
                  <button
                    onClick={() => handleStartRide(activeRide.id)}
                    className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl shadow-lg transition duration-200 text-sm uppercase tracking-wider flex items-center justify-center space-x-2"
                  >
                    <FaRoute />
                    <span>Start Passenger Ride</span>
                  </button>
                )}
                {activeRide.status === 'started' && (
                  <button
                    onClick={() => handleCompleteRide(activeRide.id)}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl shadow-lg transition duration-200 text-sm uppercase tracking-wider flex items-center justify-center space-x-2 animate-bounce"
                  >
                    <span>Complete Booking Trip</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Socket Request Popup Modal */}
      {incomingRequest && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass w-full max-w-md p-6 rounded-2xl border border-white/10 shadow-2xl relative space-y-6 bg-gradient-to-br from-slate-900 to-teal-950/10">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-teal-400 uppercase tracking-wider">New Ride Request!</h3>
              <p className="text-xs text-slate-400">Incoming request from {incomingRequest.user_name || 'Passenger'}</p>
            </div>

            <div className="space-y-4 text-xs font-medium bg-slate-950/40 p-4 rounded-xl border border-white/5">
              <div className="flex items-start space-x-2">
                <FaMapMarkerAlt className="text-teal-400 mt-0.5 shrink-0" size={13} />
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">PICKUP</span>
                  <p className="text-slate-300">{incomingRequest.pickup.address}</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <FaMapMarkerAlt className="text-pink-400 mt-0.5 shrink-0" size={13} />
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">DROP</span>
                  <p className="text-slate-300">{incomingRequest.destination.address}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Collect Fare</span>
                <span className="text-lg font-black text-teal-400">₹{incomingRequest.fare}</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-white/5">
                <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Distance</span>
                <span className="text-lg font-black text-slate-200">{incomingRequest.distance_km} km</span>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => handleRejectRide(incomingRequest.id)}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-white/5 font-bold rounded-xl transition text-xs uppercase"
              >
                Reject
              </button>
              <button
                onClick={() => handleAcceptRide(incomingRequest.id)}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl shadow-lg transition text-xs uppercase animate-pulse"
              >
                Accept offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
