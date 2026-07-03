"""Driver routes — profile, status, location, vehicle management, nearby drivers."""

from flask import Blueprint, request, jsonify, current_app, g

import math

from models.driver import (
    find_driver_by_id, update_driver, set_driver_status,
    update_driver_location, serialize_driver
)
from models.vehicle import (
    create_vehicle, find_vehicle_by_driver, update_vehicle, serialize_vehicle
)
from models.rating import get_driver_avg_rating
from middleware.auth import driver_required, user_required

driver_bp = Blueprint('driver', __name__)


def _haversine_km(lat1, lng1, lat2, lng2):
    R = 6371
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@driver_bp.route('/profile', methods=['GET'])
@driver_required
def get_profile():
    """Get the current driver's profile with vehicle and rating info."""
    db = current_app.config['db']
    driver = find_driver_by_id(db, g.current_user['id'])
    if not driver:
        return jsonify({'error': 'Driver not found'}), 404

    vehicle = find_vehicle_by_driver(db, g.current_user['id'])
    rating_info = get_driver_avg_rating(db, g.current_user['id'])

    return jsonify({
        'driver': serialize_driver(driver, include_documents=True),
        'vehicle': serialize_vehicle(vehicle),
        'rating': rating_info,
    }), 200


@driver_bp.route('/profile', methods=['PUT'])
@driver_required
def update_profile():
    """Update the current driver's profile."""
    db = current_app.config['db']
    data = request.get_json()
    driver = update_driver(db, g.current_user['id'], data)
    return jsonify({
        'message': 'Profile updated successfully',
        'driver': serialize_driver(driver),
    }), 200


@driver_bp.route('/status', methods=['PUT'])
@driver_required
def toggle_status():
    """Toggle driver online/offline status."""
    db = current_app.config['db']
    data = request.get_json()
    is_online = data.get('is_online', False)
    set_driver_status(db, g.current_user['id'], is_online)
    return jsonify({
        'message': f'Status set to {"online" if is_online else "offline"}',
        'is_online': is_online,
    }), 200


@driver_bp.route('/location', methods=['PUT'])
@driver_required
def update_location():
    """Update the driver's current GPS location."""
    db = current_app.config['db']
    data = request.get_json()
    lat = data.get('lat')
    lng = data.get('lng')
    if lat is None or lng is None:
        return jsonify({'error': 'lat and lng are required'}), 400
    update_driver_location(db, g.current_user['id'], float(lat), float(lng))
    return jsonify({'message': 'Location updated'}), 200


@driver_bp.route('/nearby', methods=['GET'])
@user_required
def get_nearby_drivers():
    """
    Return approved, online drivers near a coordinate.
    Query params: lat, lng, radius_km (default 10)
    Returns stripped driver info (no PII except name).
    """
    db = current_app.config['db']
    try:
        lat = float(request.args.get('lat', 12.9716))
        lng = float(request.args.get('lng', 77.5946))
        radius_km = float(request.args.get('radius_km', 10))
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid coordinates'}), 400

    drivers = list(db.drivers.find(
        {'is_approved': True, 'is_online': True},
        {'password': 0, 'documents': 0}
    ))

    nearby = []
    for d in drivers:
        loc = d.get('current_location', {})
        d_lat = float(loc.get('lat', 0))
        d_lng = float(loc.get('lng', 0))
        dist = _haversine_km(lat, lng, d_lat, d_lng)
        if dist <= radius_km:
            nearby.append({
                'id': str(d['_id']),
                'name': d['name'],
                'lat': d_lat,
                'lng': d_lng,
                'distance_km': round(dist, 2),
            })

    nearby.sort(key=lambda x: x['distance_km'])
    return jsonify({'drivers': nearby}), 200


@driver_bp.route('/vehicle', methods=['POST'])
@driver_required
def add_vehicle():
    """Add vehicle details for the current driver."""
    db = current_app.config['db']
    data = request.get_json()

    # Check if driver already has a vehicle
    existing = find_vehicle_by_driver(db, g.current_user['id'])
    if existing:
        return jsonify({'error': 'Vehicle already registered. Use PUT to update.'}), 409

    required = ['make', 'model', 'plate_number']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    data['driver_id'] = g.current_user['id']
    vehicle_id = create_vehicle(db, data)
    vehicle = serialize_vehicle(db.vehicles.find_one({'_id': vehicle_id}))

    return jsonify({
        'message': 'Vehicle added successfully',
        'vehicle': vehicle,
    }), 201


@driver_bp.route('/vehicle', methods=['GET'])
@driver_required
def get_vehicle():
    """Get the current driver's vehicle details."""
    db = current_app.config['db']
    vehicle = find_vehicle_by_driver(db, g.current_user['id'])
    return jsonify({'vehicle': serialize_vehicle(vehicle)}), 200


@driver_bp.route('/vehicle', methods=['PUT'])
@driver_required
def update_vehicle_details():
    """Update the current driver's vehicle details."""
    db = current_app.config['db']
    data = request.get_json()
    vehicle = update_vehicle(db, g.current_user['id'], data)
    return jsonify({
        'message': 'Vehicle updated successfully',
        'vehicle': serialize_vehicle(vehicle),
    }), 200
