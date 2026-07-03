import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaCar, FaUser, FaMapMarkerAlt, FaClock, FaRoute } from 'react-icons/fa';

// Fix Leaflet default marker icons in Vite/CRA
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PICKUP_ICON = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#14b8a6,#10b981);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
    <div style="width:8px;height:8px;border-radius:50%;background:white;"></div>
  </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const DEST_ICON = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:36px;position:relative;">
    <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#f97316,#ef4444);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
      <div style="width:8px;height:8px;border-radius:50%;background:white;"></div>
    </div>
    <div style="width:3px;height:10px;background:#ef4444;margin:0 auto;border-radius:0 0 3px 3px;"></div>
  </div>`,
  iconSize: [28, 38],
  iconAnchor: [14, 36],
});

const DRIVER_ICON = L.divIcon({
  className: '',
  html: `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:3px solid white;box-shadow:0 3px 12px rgba(99,102,241,0.6);display:flex;align-items:center;justify-content:center;font-size:18px;animation:pulse 2s infinite;">🚗</div>
  <style>@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}</style>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export default function LiveTrackingMap({
  ride,
  driverInfo,
  driverLocation,
  arrivedAlert,
  eta,
  distanceM,
  onClose,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const pickup = ride?.pickup;
  const destination = ride?.destination;

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const centerLat = pickup?.lat || 12.9716;
    const centerLng = pickup?.lng || 77.5946;

    const map = L.map(mapRef.current, {
      center: [centerLat, centerLng],
      zoom: 14,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Pickup marker
    if (pickup?.lat && pickup?.lng) {
      L.marker([pickup.lat, pickup.lng], { icon: PICKUP_ICON })
        .addTo(map)
        .bindTooltip('Pickup', { permanent: false, direction: 'top' });
    }

    // Destination marker
    if (destination?.lat && destination?.lng) {
      L.marker([destination.lat, destination.lng], { icon: DEST_ICON })
        .addTo(map)
        .bindTooltip('Destination', { permanent: false, direction: 'top' });
    }

    // Draw route line
    if (pickup?.lat && destination?.lat) {
      const line = L.polyline(
        [[pickup.lat, pickup.lng], [destination.lat, destination.lng]],
        { color: '#6366f1', weight: 4, opacity: 0.7, dashArray: '8 6' }
      ).addTo(map);
      polylineRef.current = line;
    }

    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update driver marker when location changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !driverLocation) return;
    const { lat, lng } = driverLocation;
    const map = mapInstanceRef.current;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLatLng([lat, lng]);
    } else {
      driverMarkerRef.current = L.marker([lat, lng], { icon: DRIVER_ICON })
        .addTo(map)
        .bindTooltip(driverInfo?.name || 'Driver', { permanent: false, direction: 'top' });
    }

    // Update polyline to driver's current position → target
    if (pickup && destination) {
      const target = ride?.status === 'started' ? destination : pickup;
      if (polylineRef.current) {
        polylineRef.current.setLatLngs([[lat, lng], [target.lat, target.lng]]);
      }
    }

    // Pan map to keep driver visible
    map.panTo([lat, lng], { animate: true, duration: 1 });
  }, [driverLocation, mapReady]);

  const formatDistance = (m) => {
    if (!m) return '—';
    if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
    return `${Math.round(m)} m`;
  };

  return (
    <div className="relative w-full h-full min-h-96 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Map container */}
      <div ref={mapRef} className="absolute inset-0" style={{ zIndex: 0 }} />

      {/* Driver arrived banner */}
      {arrivedAlert && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-6 py-3 bg-emerald-500 text-white rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2 animate-bounce">
          <span>🎉</span>
          <span>Your driver has arrived!</span>
        </div>
      )}

      {/* ETA / Info card */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl">
          {/* Driver info row */}
          {driverInfo && (
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <FaUser className="text-white" size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{driverInfo.name || 'Your Driver'}</p>
                <p className="text-slate-400 text-xs truncate">
                  {driverInfo.vehicle_plate || ''} {driverInfo.vehicle_make ? `· ${driverInfo.vehicle_make}` : ''}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-bold px-2 py-1 rounded-lg ${
                  ride?.status === 'started' ? 'bg-teal-500/20 text-teal-400' : 'bg-violet-500/20 text-violet-400'
                }`}>
                  {ride?.status === 'started' ? '🛣 On Trip' : '🚗 Arriving'}
                </p>
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-violet-400 mb-1">
                <FaClock size={11} />
                <span className="text-xs font-semibold">ETA</span>
              </div>
              <p className="text-white font-black text-lg leading-none">
                {eta != null ? `${eta} min` : '—'}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-teal-400 mb-1">
                <FaRoute size={11} />
                <span className="text-xs font-semibold">Distance</span>
              </div>
              <p className="text-white font-black text-lg leading-none">
                {formatDistance(distanceM)}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-orange-400 mb-1">
                <FaMapMarkerAlt size={11} />
                <span className="text-xs font-semibold">Fare</span>
              </div>
              <p className="text-white font-black text-lg leading-none">
                ₹{ride?.fare || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
