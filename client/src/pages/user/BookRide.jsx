import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MapPicker from '../../components/MapPicker';
import LiveTrackingMap from '../../components/LiveTrackingMap';
import RideStatus from '../../components/RideStatus';
import RatingModal from '../../components/RatingModal';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { FaMapMarkerAlt, FaRoute, FaArrowLeft, FaCar, FaKey } from 'react-icons/fa';

export default function BookRide() {
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [selectionMode, setSelectionMode] = useState('pickup');
  const [estimate, setEstimate] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);

  const [activeRide, setActiveRide] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [showRating, setShowRating] = useState(false);
  const [error, setError] = useState('');

  // OTP state
  const [otp, setOtp] = useState(null);
  const [arrivedAlert, setArrivedAlert] = useState(false);
  const [eta, setEta] = useState(null);
  const [distanceM, setDistanceM] = useState(null);

  const [pickupText, setPickupText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [searchingPickup, setSearchingPickup] = useState(false);
  const [searchingDest, setSearchingDest] = useState(false);

  const nearbyTimerRef = useRef(null);
  const socket = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Nearby drivers polling ─────────────────────────────────────
  const fetchNearbyDrivers = useCallback(async (lat, lng) => {
    if (!lat || !lng || activeRide) return;
    try {
      const res = await api.get(`/drivers/nearby?lat=${lat}&lng=${lng}&radius_km=15`);
      setNearbyDrivers(res.data.drivers || []);
    } catch (err) {
      // silently ignore
    }
  }, [activeRide]);

  useEffect(() => {
    if (pickup && !activeRide) {
      fetchNearbyDrivers(pickup.lat, pickup.lng);
      nearbyTimerRef.current = setInterval(() => {
        fetchNearbyDrivers(pickup.lat, pickup.lng);
      }, 5000);
    }
    return () => clearInterval(nearbyTimerRef.current);
  }, [pickup, activeRide, fetchNearbyDrivers]);

  // ── Sync address inputs with map selection ─────────────────────
  useEffect(() => {
    if (pickup) setPickupText(pickup.address || `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`);
    else setPickupText('');
  }, [pickup]);

  useEffect(() => {
    if (destination) setDestinationText(destination.address || `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`);
    else setDestinationText('');
  }, [destination]);

  // ── Active ride on mount ───────────────────────────────────────
  useEffect(() => {
    const fetchActiveRide = async () => {
      try {
        const res = await api.get('/rides/user/history');
        const active = res.data.rides.find(r => ['requested', 'accepted', 'started'].includes(r.status));
        if (active) {
          setActiveRide(active);
          setSelectionMode('none');
        }
      } catch (err) {
        console.error('Error fetching active ride:', err);
      }
    };
    fetchActiveRide();
  }, []);

  // ── Socket events ──────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    socket.on('ride_accepted', (updatedRide) => {
      setActiveRide(updatedRide);
      // Fetch driver info
      if (updatedRide.driver_id) {
        setDriverInfo({
          name: updatedRide.driver_name || 'Your Driver',
          phone: updatedRide.driver_phone || '',
        });
      }
    });

    socket.on('otp_issued', (data) => {
      setOtp(data.otp);
    });

    socket.on('otp_verified', () => {
      // Rider doesn't need to act; driver can now start the ride
    });

    socket.on('ride_started', (updatedRide) => {
      setActiveRide(updatedRide);
      setOtp(null); // clear OTP display once trip starts
      setArrivedAlert(false);
    });

    socket.on('ride_completed', (updatedRide) => {
      setActiveRide(updatedRide);
      setShowRating(true);
      setDriverLocation(null);
    });

    socket.on('ride_cancelled', () => {
      setActiveRide(null);
      setEstimate(null);
      setPickup(null);
      setDestination(null);
      setOtp(null);
      setSelectionMode('pickup');
    });

    socket.on('driver_location', (loc) => {
      setDriverLocation({ lat: loc.lat, lng: loc.lng });
      if (loc.eta_minutes != null) setEta(loc.eta_minutes);
      if (loc.distance_m != null) setDistanceM(loc.distance_m);
    });

    socket.on('driver_arrived', () => {
      setArrivedAlert(true);
    });

    socket.on('no_drivers_available', () => {
      setError('No nearby drivers available right now. Please try again in a moment.');
      setActiveRide(null);
      setSelectionMode('pickup');
    });

    return () => {
      ['ride_accepted', 'otp_issued', 'otp_verified', 'ride_started',
       'ride_completed', 'ride_cancelled', 'driver_location',
       'driver_arrived', 'no_drivers_available'].forEach(ev => socket.off(ev));
    };
  }, [socket]);

  // ── Fare estimate ──────────────────────────────────────────────
  useEffect(() => {
    if (pickup && destination) {
      const getEstimate = async () => {
        setLoadingEstimate(true);
        setError('');
        try {
          const res = await api.post('/rides/estimate', { pickup, destination });
          setEstimate(res.data);
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to estimate fare');
        } finally {
          setLoadingEstimate(false);
        }
      };
      getEstimate();
    }
  }, [pickup, destination]);

  const handleGeocode = async (address, type) => {
    if (!address?.trim()) return;
    setError('');
    if (type === 'pickup') setSearchingPickup(true);
    else setSearchingDest(true);
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await res.json();
      if (data?.features?.length > 0) {
        const feature = data.features[0];
        const lon = feature.geometry.coordinates[0];
        const lat = feature.geometry.coordinates[1];
        
        const p = feature.properties;
        const nameParts = [p.name, p.street, p.city, p.state, p.country].filter(Boolean);
        // Deduplicate name parts to avoid "Hubli, Hubli"
        const uniqueParts = [...new Set(nameParts)];
        const display_name = uniqueParts.join(', ');

        const coord = { lat: parseFloat(lat), lng: parseFloat(lon), address: display_name || address };
        if (type === 'pickup') setPickup(coord);
        else setDestination(coord);
      } else {
        setError(`No location found for "${address}"`);
      }
    } catch {
      setError('Geocoding service error');
    } finally {
      if (type === 'pickup') setSearchingPickup(false);
      else setSearchingDest(false);
    }
  };

  const handleBook = async () => {
    if (!pickup || !destination) return;
    setError('');
    try {
      const res = await api.post('/rides/book', { pickup, destination });
      setActiveRide(res.data.ride);
      setSelectionMode('none');
      setEstimate(null);
      setNearbyDrivers([]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book ride');
    }
  };

  const handleCancelRide = async (rideId) => {
    if (!window.confirm('Cancel this ride?')) return;
    try {
      await api.put(`/rides/${rideId}/cancel`);
      setActiveRide(null);
      setEstimate(null);
      setPickup(null);
      setDestination(null);
      setOtp(null);
      setSelectionMode('pickup');
    } catch {
      alert('Failed to cancel ride');
    }
  };

  const isTracking = activeRide && ['accepted', 'started'].includes(activeRide.status) && driverLocation;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2.5 bg-slate-900 border border-white/5 hover:bg-slate-800 rounded-lg text-slate-300 transition"
        >
          <FaArrowLeft size={14} />
        </button>
        <div>
          <h2 className="text-xl md:text-3xl font-black text-slate-100 uppercase tracking-tight">Book Your Ride</h2>
          <p className="text-xs md:text-sm text-slate-400 font-medium">Select pickup and dropoff to see pricing</p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-semibold text-center">
          {error}
        </div>
      )}

      {/* OTP Display Banner */}
      {otp && activeRide?.status === 'accepted' && (
        <div className="p-5 bg-gradient-to-r from-violet-500/20 to-indigo-500/20 border border-violet-500/30 rounded-2xl text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FaKey className="text-violet-400" />
            <p className="text-violet-300 font-bold text-sm uppercase tracking-wider">Your Ride OTP</p>
          </div>
          <p className="text-white text-5xl font-black tracking-[0.3em] my-3">{otp}</p>
          <p className="text-slate-400 text-xs">Share this code with your driver to start the trip</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Booking form / Ride status */}
        <div className="space-y-6">
          {!activeRide ? (
            <div className="glass p-6 rounded-2xl border border-white/5 shadow-xl space-y-6">
              {/* Nearby drivers list */}
              {nearbyDrivers.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Nearby Available Drivers</h4>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                    {nearbyDrivers.map(driver => (
                      <div key={driver.id} className="flex items-center justify-between px-4 py-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-900 border border-teal-500/30 flex items-center justify-center shrink-0">
                            <FaCar className="text-teal-400" size={14} />
                          </div>
                          <div>
                            <span className="text-slate-200 text-sm font-bold block">{driver.name}</span>
                            <span className="text-teal-300 text-[10px] font-semibold uppercase tracking-wider">{driver.distance_km} km away</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pickup */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Pickup Point</label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-teal-400 pointer-events-none">
                      <FaMapMarkerAlt size={14} />
                    </span>
                    <input
                      type="text"
                      className={`w-full pl-9 pr-4 py-3 bg-slate-900 border rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition ${selectionMode === 'pickup' ? 'border-teal-500 ring-1 ring-teal-500' : 'border-white/5 focus:border-teal-500/50'}`}
                      placeholder="Type or click map…"
                      value={pickupText}
                      onChange={(e) => setPickupText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleGeocode(pickupText, 'pickup'); }}
                      onFocus={() => setSelectionMode('pickup')}
                    />
                  </div>
                  <button
                    onClick={() => handleGeocode(pickupText, 'pickup')}
                    disabled={searchingPickup}
                    className="px-4 py-3 bg-teal-500/10 hover:bg-teal-500 hover:text-slate-950 text-teal-400 font-bold rounded-xl text-sm border border-teal-500/20 hover:border-transparent transition min-w-[76px]"
                  >
                    {searchingPickup ? <span className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin block" /> : 'Search'}
                  </button>
                </div>
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider">Destination</label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-pink-400 pointer-events-none">
                      <FaMapMarkerAlt size={14} />
                    </span>
                    <input
                      type="text"
                      className={`w-full pl-9 pr-4 py-3 bg-slate-900 border rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition ${selectionMode === 'destination' ? 'border-pink-500 ring-1 ring-pink-500' : 'border-white/5 focus:border-pink-500/50'}`}
                      placeholder="Type or click map…"
                      value={destinationText}
                      onChange={(e) => setDestinationText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleGeocode(destinationText, 'destination'); }}
                      onFocus={() => setSelectionMode('destination')}
                    />
                  </div>
                  <button
                    onClick={() => handleGeocode(destinationText, 'destination')}
                    disabled={searchingDest}
                    className="px-4 py-3 bg-pink-500/10 hover:bg-pink-500 hover:text-slate-950 text-pink-400 font-bold rounded-xl text-sm border border-pink-500/20 hover:border-transparent transition min-w-[76px]"
                  >
                    {searchingDest ? <span className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin block" /> : 'Search'}
                  </button>
                </div>
              </div>

              {/* Estimate */}
              {loadingEstimate && (
                <div className="text-center py-4 bg-slate-900/50 rounded-xl border border-white/5 flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold text-slate-400">Calculating fare…</span>
                </div>
              )}
              {estimate && !loadingEstimate && (
                <div className="bg-slate-900/50 p-5 rounded-xl border border-white/5 space-y-4">
                  <h4 className="text-xs text-teal-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                    <FaRoute />
                    <span>Fare Estimate</span>
                  </h4>
                  <div className="flex justify-between text-sm font-semibold text-slate-300">
                    <span>Distance</span>
                    <span>{estimate.distance_km} km</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/5 pt-3">
                    <span className="text-sm font-semibold text-slate-100">Total Fare</span>
                    <span className="text-2xl font-black text-teal-400">₹{estimate.fare}</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleBook}
                disabled={!pickup || !destination || loadingEstimate}
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 disabled:from-slate-800 disabled:to-slate-800 text-slate-950 disabled:text-slate-500 font-black rounded-xl shadow-lg transition text-sm uppercase tracking-wider"
              >
                Request Ride Now
              </button>
            </div>
          ) : (
            <RideStatus
              ride={activeRide}
              driverInfo={driverInfo}
              otp={otp}
              arrivedAlert={arrivedAlert}
              eta={eta}
              onCancel={handleCancelRide}
            />
          )}
        </div>

        {/* Right: Map */}
        <div className="lg:col-span-2" style={{ minHeight: 480 }}>
          {isTracking ? (
            <LiveTrackingMap
              ride={activeRide}
              driverInfo={driverInfo}
              driverLocation={driverLocation}
              arrivedAlert={arrivedAlert}
              eta={eta}
              distanceM={distanceM}
            />
          ) : (
            <MapPicker
              pickup={pickup || activeRide?.pickup}
              setPickup={setPickup}
              destination={destination || activeRide?.destination}
              setDestination={setDestination}
              selectionMode={selectionMode}
              driverLocation={driverLocation}
              nearbyDrivers={!activeRide ? nearbyDrivers : []}
            />
          )}
        </div>
      </div>

      {showRating && activeRide && (
        <RatingModal
          ride={activeRide}
          onClose={() => {
            setShowRating(false);
            setActiveRide(null);
            setPickup(null);
            setDestination(null);
            setSelectionMode('pickup');
          }}
          onSubmitSuccess={() => alert('Thank you for rating your ride!')}
        />
      )}
    </div>
  );
}
