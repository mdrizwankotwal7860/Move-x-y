import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Create custom leaflet marker icons to avoid Vite hashing resolution bugs
const createCustomIcon = (color, text) => {
  return new L.DivIcon({
    html: `
      <div class="flex flex-col items-center">
        <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-slate-900 shadow-lg text-white font-bold" style="background-color: ${color};">
          ${text}
        </div>
        <div class="w-1.5 h-1.5 -mt-0.5 rounded-full" style="background-color: ${color};"></div>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  });
};

const pickupIcon = createCustomIcon('#14b8a6', 'P'); // Teal for Pickup
const destIcon = createCustomIcon('#ec4899', 'D'); // Pink for Destination
const driverIcon = createCustomIcon('#eab308', '🚗'); // Yellow for Driver

// Map events sub-component to handle map click events
function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Map flight animation to fit both markers
function FitBounds({ pickup, dest }) {
  const map = useMap();
  useEffect(() => {
    if (pickup && dest) {
      const bounds = L.latLngBounds([pickup.lat, pickup.lng], [dest.lat, dest.lng]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (pickup) {
      map.setView([pickup.lat, pickup.lng], 14);
    } else if (dest) {
      map.setView([dest.lat, dest.lng], 14);
    }
  }, [pickup, dest, map]);
  return null;
}

export default function MapPicker({
  pickup,
  setPickup,
  destination,
  setDestination,
  selectionMode, // 'pickup' | 'destination' | 'none'
  driverLocation, // { lat, lng } (optional)
}) {
  const defaultPosition = [12.9716, 77.5946]; // Bangalore center
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  useEffect(() => {
    if (pickup && destination) {
      const fetchRoute = async () => {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data.routes && data.routes.length > 0) {
              const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
              setRouteCoordinates(coords);
            } else {
              setRouteCoordinates([[pickup.lat, pickup.lng], [destination.lat, destination.lng]]);
            }
          } else {
            console.error("OSRM Route Fetching Failed:", res.status);
            setRouteCoordinates([[pickup.lat, pickup.lng], [destination.lat, destination.lng]]);
          }
        } catch (err) {
          console.error("OSRM Route Fetching Error:", err);
          setRouteCoordinates([[pickup.lat, pickup.lng], [destination.lat, destination.lng]]);
        }
      };
      fetchRoute();
    } else {
      setRouteCoordinates([]);
    }
  }, [pickup, destination]);

  const handleMapClick = async (lat, lng) => {
    if (selectionMode === 'none') return;

    // Fetch address string from OpenStreetMap Nominatim reverse geocoder
    let address = `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    try {
      const response = await fetch(
        `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data?.features?.length > 0) {
          const p = data.features[0].properties;
          const nameParts = [p.name, p.street, p.city, p.state].filter(Boolean);
          const uniqueParts = [...new Set(nameParts)];
          address = uniqueParts.join(', ') || address;
        }
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    }

    if (selectionMode === 'pickup') {
      setPickup({ lat, lng, address });
    } else if (selectionMode === 'destination') {
      setDestination({ lat, lng, address });
    }
  };

  return (
    <div className="relative w-full h-[350px] md:h-[450px] rounded-xl overflow-hidden shadow-2xl border border-white/5">
      <MapContainer
        center={defaultPosition}
        zoom={15}
        maxZoom={19}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEvents onMapClick={handleMapClick} />
        <FitBounds pickup={pickup} dest={destination} />

        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>
              <div className="text-xs font-semibold p-1">
                <span className="text-teal-400 font-bold block mb-1">PICKUP LOCATION</span>
                <span className="text-slate-300 font-normal">{pickup.address}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
            <Popup>
              <div className="text-xs font-semibold p-1">
                <span className="text-pink-400 font-bold block mb-1">DESTINATION</span>
                <span className="text-slate-300 font-normal">{destination.address}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {driverLocation && driverLocation.lat && driverLocation.lng && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
            <Popup>
              <div className="text-xs font-semibold p-1">
                <span className="text-yellow-400 font-bold block">Live Driver Location</span>
              </div>
            </Popup>
          </Marker>
        )}

        {pickup && destination && (
          <>
            {/* Glow outer Polyline */}
            <Polyline
              key={`glow-${routeCoordinates.length}-${pickup.lat}-${destination.lat}`}
              positions={routeCoordinates.length > 0 ? routeCoordinates : [[pickup.lat, pickup.lng], [destination.lat, destination.lng]]}
              color="#06b6d4"
              weight={8}
              opacity={0.25}
            />
            {/* Main actual road Polyline */}
            <Polyline
              key={`main-${routeCoordinates.length}-${pickup.lat}-${destination.lat}`}
              positions={routeCoordinates.length > 0 ? routeCoordinates : [[pickup.lat, pickup.lng], [destination.lat, destination.lng]]}
              color="#14b8a6"
              weight={4}
              opacity={0.8}
            />
          </>
        )}
      </MapContainer>

      {selectionMode !== 'none' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] glass px-4 py-2 rounded-full shadow-lg border border-white/10 flex items-center space-x-2 text-sm font-semibold">
          <div className={`w-3 h-3 rounded-full animate-pulse ${selectionMode === 'pickup' ? 'bg-teal-400' : 'bg-pink-400'}`}></div>
          <span className="text-slate-100 uppercase tracking-wider">
            Click on map to select {selectionMode}
          </span>
        </div>
      )}
    </div>
  );
}
