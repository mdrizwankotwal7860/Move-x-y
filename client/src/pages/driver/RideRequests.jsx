import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { FaCompass, FaMapMarkerAlt, FaRoute, FaArrowLeft, FaCheck, FaTimes } from 'react-icons/fa';

export default function RideRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const socket = useSocket();

  const fetchRequests = async () => {
    try {
      const res = await api.get('/rides/driver/requests');
      setRequests(res.data.rides);
    } catch (err) {
      console.error('Failed to load pending requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    // Listen for new requests explicitly offered to this driver
    socket.on('ride_requested', (ride) => {
      // Add or update the ride in the requests list
      setRequests((prev) => {
        if (prev.find(r => r.id === ride.id)) return prev;
        return [ride, ...prev];
      });
      // Optionally play a sound here
    });

    socket.on('ride_withdrawn', (data) => {
      // Remove the ride if it timed out or was taken by someone else
      setRequests((prev) => prev.filter(r => r.id !== data.ride_id));
    });

    return () => {
      socket.off('ride_requested');
      socket.off('ride_withdrawn');
    };
  }, [socket]);

  const handleAccept = async (rideId) => {
    try {
      await api.put(`/rides/${rideId}/accept`);
      navigate('/driver');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to accept ride');
      fetchRequests();
    }
  };

  const handleReject = async (rideId) => {
    try {
      await api.put(`/rides/${rideId}/reject`);
      setRequests((prev) => prev.filter(r => r.id !== rideId));
    } catch (err) {
      console.error(err);
      alert('Failed to reject ride');
    }
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
            <FaCompass className="text-teal-400" />
            <span>Pending Ride Requests</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400 font-medium">Coordinate and accept from passenger booking request sheets</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="glass p-12 text-center rounded-2xl border border-white/5 shadow-xl space-y-4">
          <div className="text-6xl text-slate-700">🔍</div>
          <p className="text-slate-400 text-sm font-semibold">No active pending ride booking requests found at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((ride) => (
            <div key={ride.id} className="glass p-5 rounded-2xl border border-white/5 shadow-xl space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs pb-2.5 border-b border-white/5">
                  <span className="text-slate-400 font-bold">Passenger: {ride.user_name}</span>
                  <span className="text-slate-500 font-semibold">#{ride.id.slice(-6).toUpperCase()}</span>
                </div>

                <div className="space-y-3 text-xs font-medium">
                  <div className="flex items-start space-x-2">
                    <FaMapMarkerAlt className="text-teal-400 mt-0.5 shrink-0" size={13} />
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">PICKUP</span>
                      <p className="text-slate-300 leading-normal">{ride.pickup.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <FaMapMarkerAlt className="text-pink-400 mt-0.5 shrink-0" size={13} />
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-0.5">DROP</span>
                      <p className="text-slate-300 leading-normal">{ride.destination.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3 text-center">
                  <div className="bg-slate-900/50 p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-semibold">Collect Fare</span>
                    <span className="text-base font-extrabold text-teal-400">₹{ride.fare}</span>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-semibold">Distance</span>
                    <span className="text-base font-extrabold text-slate-200">{ride.distance_km} km</span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleReject(ride.id)}
                    className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 font-bold rounded-xl border border-rose-500/20 hover:border-transparent transition duration-200 text-xs uppercase tracking-wider flex items-center justify-center space-x-1"
                  >
                    <FaTimes />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleAccept(ride.id)}
                    className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl shadow transition duration-200 text-xs uppercase tracking-wider flex items-center justify-center space-x-1"
                  >
                    <FaCheck />
                    <span>Accept</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
