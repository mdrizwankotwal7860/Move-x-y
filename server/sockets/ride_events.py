"""Socket.IO event handlers for real-time ride updates, GPS tracking, and arrived detection."""

import math
from datetime import datetime


def _haversine_m(lat1, lng1, lat2, lng2):
    """Return distance in metres between two coordinates."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = (math.sin(dphi / 2) ** 2
         + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _eta_minutes(distance_km, speed_kmh=25):
    """Rough ETA estimate in minutes given distance and assumed speed."""
    if distance_km <= 0:
        return 0
    return round((distance_km / speed_kmh) * 60, 1)


def register_socket_events(socketio):
    """Register all Socket.IO event handlers."""

    @socketio.on('connect')
    def handle_connect():
        print('[Socket.IO] Client connected')

    @socketio.on('disconnect')
    def handle_disconnect():
        print('[Socket.IO] Client disconnected')

    @socketio.on('join_room')
    def handle_join_room(data):
        """
        Client joins a room identified by their user/driver ID.
        This allows targeted notifications.
        """
        room = data.get('room')
        if room:
            from flask_socketio import join_room
            join_room(room)
            print(f'[Socket.IO] Client joined room: {room}')

    @socketio.on('leave_room')
    def handle_leave_room(data):
        """Client leaves a room."""
        room = data.get('room')
        if room:
            from flask_socketio import leave_room
            leave_room(room)
            print(f'[Socket.IO] Client left room: {room}')

    @socketio.on('location_update')
    def handle_location_update(data):
        """
        Driver sends periodic GPS location updates (every 2-3 seconds).
        - Persists point to gps_history collection.
        - Checks if driver is within 50 m of pickup → emits driver_arrived.
        - Broadcasts driver_location with ETA to rider's room.
        """
        from flask import current_app
        

        driver_id = data.get('driver_id')
        ride_id = data.get('ride_id')
        lat = data.get('lat')
        lng = data.get('lng')
        user_id = data.get('user_id')
        ride_status = data.get('ride_status', 'accepted')  # 'accepted' or 'started'

        if not all([driver_id, ride_id, lat is not None, lng is not None]):
            return

        try:
            lat = float(lat)
            lng = float(lng)
        except (ValueError, TypeError):
            return

        # ── Persist GPS point ──────────────────────────────────────
        try:
            app = current_app._get_current_object()
            db = app.config['db']

            db.gps_history.update_one(
                {'ride_id': str(ride_id)},
                {
                    '$setOnInsert': {'driver_id': str(driver_id)},
                    '$push': {'points': {
                        'lat': lat, 'lng': lng,
                        'ts': datetime.utcnow().isoformat()
                    }},
                },
                upsert=True,
            )

            # Update driver's current_location in DB
            db.drivers.update_one(
                {'_id': str(driver_id)},
                {'$set': {'current_location': {'lat': lat, 'lng': lng}}}
            )

            # ── Fetch ride to get pickup/destination ───────────────
            ride = db.rides.find_one({'_id': str(ride_id)})
            if not ride:
                return

            pickup = ride.get('pickup', {})
            destination = ride.get('destination', {})

            # ── Compute ETA & distance to target ──────────────────
            if ride_status == 'accepted':
                # Driver is heading to pickup
                target_lat = float(pickup.get('lat', lat))
                target_lng = float(pickup.get('lng', lng))
            else:
                # Driver is heading to destination (ride started)
                target_lat = float(destination.get('lat', lat))
                target_lng = float(destination.get('lng', lng))

            dist_m = _haversine_m(lat, lng, target_lat, target_lng)
            dist_km = dist_m / 1000
            eta = _eta_minutes(dist_km)

            # ── Broadcast location update to rider ─────────────────
            if user_id:
                socketio.emit('driver_location', {
                    'driver_id': driver_id,
                    'ride_id': ride_id,
                    'lat': lat,
                    'lng': lng,
                    'distance_m': round(dist_m),
                    'distance_km': round(dist_km, 2),
                    'eta_minutes': eta,
                    'ride_status': ride_status,
                }, room=user_id)

            # ── Driver Arrived check (50 m radius, going to pickup) ─
            if ride_status == 'accepted' and dist_m <= 50:
                already_notified = ride.get('driver_arrived_emitted', False)
                if not already_notified:
                    db.rides.update_one(
                        {'_id': str(ride_id)},
                        {'$set': {'driver_arrived_emitted': True}}
                    )
                    if user_id:
                        socketio.emit('driver_arrived', {
                            'ride_id': ride_id,
                            'message': 'Your driver has arrived at the pickup location!',
                        }, room=user_id)
                    print(f'[Socket.IO] Driver arrived at pickup for ride {ride_id}')

            # ── Trip nearly complete (50 m from destination) ────────
            if ride_status == 'started' and dist_m <= 50:
                if user_id:
                    socketio.emit('trip_nearly_complete', {
                        'ride_id': ride_id,
                        'message': 'You are almost at your destination!',
                    }, room=user_id)

        except Exception as e:
            print(f'[Socket.IO] Error in location_update: {e}')

    print('[Socket.IO] Event handlers registered')
