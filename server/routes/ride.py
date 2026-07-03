"""Ride routes — booking, status updates, history, fare estimation."""

from flask import Blueprint, request, jsonify, current_app, g

import random
import string
from datetime import datetime

from models.ride import (
    create_ride, find_ride_by_id, update_ride_status,
    get_user_rides, get_driver_rides, get_pending_rides,
    serialize_ride
)
from models.driver import get_available_drivers, serialize_driver
from models.user import serialize_user
from utils.fare import estimate_fare, haversine_distance, calculate_fare
from middleware.auth import user_required, driver_required, any_authenticated

ride_bp = Blueprint('ride', __name__)


def _generate_otp():
    """Generate a random 4-digit numeric OTP."""
    return ''.join(random.choices(string.digits, k=4))


@ride_bp.route('/estimate', methods=['POST'])
@user_required
def get_fare_estimate():
    """Get a fare estimate without booking."""
    data = request.get_json()
    pickup = data.get('pickup', {})
    destination = data.get('destination', {})

    if not all([pickup.get('lat'), pickup.get('lng'),
                destination.get('lat'), destination.get('lng')]):
        return jsonify({'error': 'Pickup and destination coordinates are required'}), 400

    result = estimate_fare(
        float(pickup['lat']), float(pickup['lng']),
        float(destination['lat']), float(destination['lng'])
    )

    return jsonify(result), 200


@ride_bp.route('/book', methods=['POST'])
@user_required
def book_ride():
    """Book a new ride."""
    data = request.get_json()
    db = current_app.config['db']
    socketio = current_app.config.get('socketio')

    pickup = data.get('pickup', {})
    destination = data.get('destination', {})

    if not all([pickup.get('lat'), pickup.get('lng'),
                destination.get('lat'), destination.get('lng')]):
        return jsonify({'error': 'Pickup and destination coordinates are required'}), 400

    # Calculate distance and fare
    fare_info = estimate_fare(
        float(pickup['lat']), float(pickup['lng']),
        float(destination['lat']), float(destination['lng'])
    )

    ride_data = {
        'user_id': g.current_user['id'],
        'pickup': pickup,
        'destination': destination,
        'distance_km': fare_info['distance_km'],
        'fare': fare_info['fare'],
    }

    ride_id = create_ride(db, ride_data)
    ride = find_ride_by_id(db, ride_id)

    # Trigger sequential dispatch in background
    import threading
    threading.Thread(target=dispatch_ride_sequential, args=(db, str(ride_id), socketio)).start()

    return jsonify({
        'message': 'Ride booked successfully',
        'ride': serialize_ride(ride),
    }), 201


@ride_bp.route('/<ride_id>/accept', methods=['PUT'])
@driver_required
def accept_ride(ride_id):
    """Driver accepts a ride request."""
    db = current_app.config['db']
    socketio = current_app.config.get('socketio')

    ride = find_ride_by_id(db, ride_id)
    if not ride:
        return jsonify({'error': 'Ride not found'}), 404
    if ride['status'] != 'requested':
        return jsonify({'error': 'Ride is no longer available'}), 400

    # Removed the offered_driver_id restriction so any driver can accept from the open pool
    # if ride.get('offered_driver_id') != str(g.current_user['id']):
    #     return jsonify({'error': 'This ride offer has expired or is no longer valid.'}), 400

    # Generate OTP
    otp = _generate_otp()
    db.rides.update_one(
        {'_id': str(ride_id)},
        {'$set': {
            'otp': otp,
            'otp_verified': False,
            'otp_issued_at': datetime.utcnow().isoformat(),
        }}
    )

    ride = update_ride_status(db, ride_id, 'accepted', driver_id=g.current_user['id'])

    # Notify user via Socket.IO — include OTP for display
    if socketio:
        driver = db.drivers.find_one({'_id': str(g.current_user['id'])})
        ride_info = serialize_ride(ride)
        ride_info['driver_name'] = driver['name'] if driver else 'Unknown'
        ride_info['driver_phone'] = driver.get('phone', '') if driver else ''
        socketio.emit('ride_accepted', ride_info, room=str(ride['user_id']))
        # Emit OTP to rider for display
        socketio.emit('otp_issued', {
            'ride_id': str(ride_id),
            'otp': otp,
            'message': 'Share this OTP with your driver to start the ride.',
        }, room=str(ride['user_id']))

    return jsonify({
        'message': 'Ride accepted',
        'ride': serialize_ride(ride),
    }), 200


@ride_bp.route('/<ride_id>/reject', methods=['PUT'])
@driver_required
def reject_ride(ride_id):
    """Driver rejects a ride request (ride stays as 'requested' for other drivers)."""
    db = current_app.config['db']
    socketio = current_app.config.get('socketio')

    ride = find_ride_by_id(db, ride_id)
    if not ride:
        return jsonify({'error': 'Ride not found'}), 404

    driver_id = str(g.current_user['id'])
    
    # Check if this driver was the one offered the ride
    if ride.get('offered_driver_id') == driver_id:
        print(f'[Dispatch] Driver {driver_id} rejected ride {ride_id}. Offering to next driver.')
        db.rides.update_one(
            {'_id': str(ride_id)},
            {
                '$push': {'rejected_drivers': driver_id},
                '$set': {'offered_driver_id': None}
            }
        )
        
        # Trigger next match immediately
        import threading
        threading.Thread(target=dispatch_ride_sequential, args=(db, str(ride_id), socketio)).start()

    return jsonify({'message': 'Ride rejected'}), 200


@ride_bp.route('/<ride_id>/verify-otp', methods=['PUT'])
@driver_required
def verify_otp(ride_id):
    """Driver submits the OTP to unlock ride start."""
    db = current_app.config['db']
    socketio = current_app.config.get('socketio')

    ride = find_ride_by_id(db, ride_id)
    if not ride:
        return jsonify({'error': 'Ride not found'}), 404
    if ride['status'] != 'accepted':
        return jsonify({'error': 'Ride must be in accepted state'}), 400
    if str(ride.get('driver_id', '')) != g.current_user['id']:
        return jsonify({'error': 'Not your ride'}), 403

    data = request.get_json()
    submitted_otp = str(data.get('otp', '')).strip()

    if submitted_otp != ride.get('otp'):
        return jsonify({'error': 'Invalid OTP. Please ask your rider for the correct code.'}), 400

    db.rides.update_one(
        {'_id': str(ride_id)},
        {'$set': {'otp_verified': True}}
    )

    if socketio:
        socketio.emit('otp_verified', {'ride_id': ride_id}, room=str(ride['user_id']))

    return jsonify({'message': 'OTP verified. You may now start the ride.'}), 200


@ride_bp.route('/<ride_id>/start', methods=['PUT'])
@driver_required
def start_ride(ride_id):
    """Driver starts the ride (requires OTP verification)."""
    db = current_app.config['db']
    socketio = current_app.config.get('socketio')

    ride = find_ride_by_id(db, ride_id)
    if not ride:
        return jsonify({'error': 'Ride not found'}), 404
    if ride['status'] != 'accepted':
        return jsonify({'error': 'Ride must be accepted before starting'}), 400
    if str(ride['driver_id']) != g.current_user['id']:
        return jsonify({'error': 'Not your ride'}), 403
    if not ride.get('otp_verified', False):
        return jsonify({'error': 'OTP not verified. Ask the rider for the OTP first.'}), 403

    ride = update_ride_status(db, ride_id, 'started')

    if socketio:
        socketio.emit('ride_started', serialize_ride(ride), room=str(ride['user_id']))

    return jsonify({
        'message': 'Ride started',
        'ride': serialize_ride(ride),
    }), 200


@ride_bp.route('/<ride_id>/complete', methods=['PUT'])
@driver_required
def complete_ride(ride_id):
    """Driver completes the ride."""
    db = current_app.config['db']
    socketio = current_app.config.get('socketio')

    ride = find_ride_by_id(db, ride_id)
    if not ride:
        return jsonify({'error': 'Ride not found'}), 404
    if ride['status'] != 'started':
        return jsonify({'error': 'Ride must be started before completing'}), 400
    if str(ride['driver_id']) != g.current_user['id']:
        return jsonify({'error': 'Not your ride'}), 403

    ride = update_ride_status(db, ride_id, 'completed')

    if socketio:
        socketio.emit('ride_completed', serialize_ride(ride), room=str(ride['user_id']))

    return jsonify({
        'message': 'Ride completed',
        'ride': serialize_ride(ride),
    }), 200


@ride_bp.route('/<ride_id>/cancel', methods=['PUT'])
@any_authenticated
def cancel_ride(ride_id):
    """Cancel a ride (by user or driver)."""
    db = current_app.config['db']
    socketio = current_app.config.get('socketio')

    ride = find_ride_by_id(db, ride_id)
    if not ride:
        return jsonify({'error': 'Ride not found'}), 404
    if ride['status'] in ['completed', 'cancelled']:
        return jsonify({'error': 'Ride cannot be cancelled'}), 400

    ride = update_ride_status(db, ride_id, 'cancelled')

    if socketio:
        socketio.emit('ride_cancelled', serialize_ride(ride), room=str(ride['user_id']))
        if ride.get('driver_id'):
            socketio.emit('ride_cancelled', serialize_ride(ride), room=str(ride['driver_id']))

    return jsonify({
        'message': 'Ride cancelled',
        'ride': serialize_ride(ride),
    }), 200


@ride_bp.route('/<ride_id>', methods=['GET'])
@any_authenticated
def get_ride(ride_id):
    """Get details of a specific ride."""
    db = current_app.config['db']
    ride = find_ride_by_id(db, ride_id)
    if not ride:
        return jsonify({'error': 'Ride not found'}), 404

    ride_data = serialize_ride(ride)

    # Enrich with user and driver names
    user = db.users.find_one({'_id': ride['user_id']})
    ride_data['user_name'] = user['name'] if user else 'Unknown'

    if ride.get('driver_id'):
        driver = db.drivers.find_one({'_id': ride['driver_id']})
        ride_data['driver_name'] = driver['name'] if driver else 'Unknown'

    return jsonify({'ride': ride_data}), 200


@ride_bp.route('/user/history', methods=['GET'])
@user_required
def user_ride_history():
    """Get ride history for the current user."""
    db = current_app.config['db']
    rides = get_user_rides(db, g.current_user['id'])

    result = []
    for ride in rides:
        ride_data = serialize_ride(ride)
        if ride.get('driver_id'):
            driver = db.drivers.find_one({'_id': ride['driver_id']})
            ride_data['driver_name'] = driver['name'] if driver else 'Unknown'
        result.append(ride_data)

    return jsonify({'rides': result}), 200


@ride_bp.route('/driver/history', methods=['GET'])
@driver_required
def driver_ride_history():
    """Get ride history for the current driver."""
    db = current_app.config['db']
    rides = get_driver_rides(db, g.current_user['id'])

    result = []
    for ride in rides:
        ride_data = serialize_ride(ride)
        user = db.users.find_one({'_id': ride['user_id']})
        ride_data['user_name'] = user['name'] if user else 'Unknown'
        result.append(ride_data)

    return jsonify({'rides': result}), 200


@ride_bp.route('/driver/requests', methods=['GET'])
@driver_required
def driver_ride_requests():
    """Get pending ride requests for drivers."""
    db = current_app.config['db']
    rides = get_pending_rides(db)

    result = []
    for ride in rides:
        ride_data = serialize_ride(ride)
        user = db.users.find_one({'_id': ride['user_id']})
        ride_data['user_name'] = user['name'] if user else 'Unknown'
        result.append(ride_data)

    return jsonify({'rides': result}), 200


def dispatch_ride_sequential(db, ride_id, socketio):
    """
    Asynchronous sequential ride dispatcher.
    Finds the closest eligible online driver, updates ride status, and sets a timeout.
    """
    # 1. Retrieve the ride
    ride = db.rides.find_one({'_id': str(ride_id)})
    if not ride or ride.get('status') != 'requested':
        print(f'[Dispatch] Ride {ride_id} is no longer requested. Stopping.')
        return

    # 2. Find eligible drivers (approved, online, and not currently on an active ride)
    active_rides = list(db.rides.find({'status': {'$in': ['accepted', 'started']}}))
    busy_driver_ids = {r['driver_id'] for r in active_rides if r.get('driver_id')}

    excluded_driver_ids = set(ride.get('rejected_drivers', []))
    excluded_driver_ids.update(busy_driver_ids)

    query = {
        'is_approved': True,
        'is_online': True,
        '_id': {'$nin': list(excluded_driver_ids)}
    }
    eligible_drivers = list(db.drivers.find(query))

    # 3. If no drivers are available, notify rider
    if not eligible_drivers:
        print(f'[Dispatch] No eligible drivers found for ride {ride_id}.')
        if socketio:
            socketio.emit('no_drivers_available', {
                'ride_id': str(ride_id),
                'message': 'No nearby drivers available at the moment.'
            }, room=str(ride['user_id']))
        return

    # 4. Calculate distances and find closest driver
    pickup_lat = float(ride['pickup']['lat'])
    pickup_lng = float(ride['pickup']['lng'])

    closest_driver = None
    min_dist = float('inf')

    for driver in eligible_drivers:
        loc = driver.get('current_location', {})
        d_lat = float(loc.get('lat', 12.9716))
        d_lng = float(loc.get('lng', 77.5946))
        dist = haversine_distance(pickup_lat, pickup_lng, d_lat, d_lng)
        if dist < min_dist:
            min_dist = dist
            closest_driver = driver

    # 5. Offer ride to the closest driver
    driver_id = closest_driver['_id']
    db.rides.update_one(
        {'_id': str(ride_id)},
        {'$set': {'offered_driver_id': driver_id}}
    )

    # 6. Notify driver
    if socketio:
        ride_info = serialize_ride(find_ride_by_id(db, ride_id))
        user = db.users.find_one({'_id': ride['user_id']})
        ride_info['user_name'] = user['name'] if user else 'Unknown'
        
        print(f'[Dispatch] Offering ride {ride_id} to driver {driver_id} (distance: {min_dist}km)')
        socketio.emit('ride_requested', ride_info, room=str(driver_id))

    # 7. Spawn 15-second timeout check
    import threading
    threading.Timer(15.0, check_ride_timeout, args=[db, ride_id, driver_id, socketio]).start()


def check_ride_timeout(db, ride_id, driver_id, socketio):
    """
    Gevent callback to check if driver accepted within 15 seconds.
    If not, add them to rejections and look for next driver.
    """
    ride = db.rides.find_one({'_id': str(ride_id)})
    if not ride:
        return

    if ride.get('status') == 'requested' and ride.get('offered_driver_id') == driver_id:
        print(f'[Dispatch] Offer for ride {ride_id} timed out for driver {driver_id}')
        
        # Withdraw popup from driver
        if socketio:
            socketio.emit('ride_withdrawn', {
                'ride_id': str(ride_id),
                'message': 'Ride offer expired.'
            }, room=str(driver_id))

        # Add to rejections and clear offer
        db.rides.update_one(
            {'_id': str(ride_id)},
            {
                '$push': {'rejected_drivers': driver_id},
                '$set': {'offered_driver_id': None}
            }
        )

        # Dispatch to next closest
        dispatch_ride_sequential(db, ride_id, socketio)
