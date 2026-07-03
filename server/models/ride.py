import uuid
"""Ride model — helper functions for the 'rides' MongoDB collection."""

from datetime import datetime



# Valid ride statuses
RIDE_STATUSES = ['requested', 'accepted', 'started', 'completed', 'cancelled']


def create_ride(db, data):
    """Insert a new ride document and return its ID."""
    ride = {
        '_id': str(uuid.uuid4()),
        'user_id': str(data['user_id']),
        'driver_id': None,
        'pickup': {
            'lat': float(data['pickup']['lat']),
            'lng': float(data['pickup']['lng']),
            'address': data['pickup'].get('address', ''),
        },
        'destination': {
            'lat': float(data['destination']['lat']),
            'lng': float(data['destination']['lng']),
            'address': data['destination'].get('address', ''),
        },
        'distance_km': float(data.get('distance_km', 0)),
        'fare': float(data.get('fare', 0)),
        'status': 'requested',
        'offered_driver_id': None,
        'rejected_drivers': [],
        # OTP fields — populated when driver accepts
        'otp': None,
        'otp_verified': False,
        'otp_issued_at': None,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow(),
    }
    result = db.rides.insert_one(ride)
    return result.inserted_id


def find_ride_by_id(db, ride_id):
    """Return a single ride by its ObjectId."""
    return db.rides.find_one({'_id': str(ride_id)})


def update_ride_status(db, ride_id, status, driver_id=None):
    """Update the status of a ride, optionally assigning a driver."""
    update = {
        '$set': {
            'status': status,
            'updated_at': datetime.utcnow(),
        }
    }
    if driver_id:
        update['$set']['driver_id'] = str(driver_id)
    db.rides.update_one({'_id': str(ride_id)}, update)
    return find_ride_by_id(db, ride_id)


def get_user_rides(db, user_id):
    """Return all rides for a specific user, newest first."""
    return list(db.rides.find(
        {'user_id': str(user_id)}
    ).sort('created_at', -1))


def get_driver_rides(db, driver_id):
    """Return all rides assigned to a specific driver, newest first."""
    return list(db.rides.find(
        {'driver_id': str(driver_id)}
    ).sort('created_at', -1))


def get_pending_rides(db):
    """Return all rides with 'requested' status."""
    return list(db.rides.find({'status': 'requested'}).sort('created_at', -1))


def get_all_rides(db):
    """Return every ride (admin use), newest first."""
    return list(db.rides.find().sort('created_at', -1))


def count_rides(db):
    """Return total ride count."""
    return db.rides.count_documents({})


def serialize_ride(ride):
    """Convert a ride document to a JSON-safe dict."""
    if not ride:
        return None
    return {
        'id': str(ride['_id']),
        'user_id': str(ride['user_id']),
        'driver_id': str(ride['driver_id']) if ride.get('driver_id') else None,
        'pickup': ride['pickup'],
        'destination': ride['destination'],
        'distance_km': ride.get('distance_km', 0),
        'fare': ride.get('fare', 0),
        'status': ride['status'],
        'otp': ride.get('otp'),
        'otp_verified': ride.get('otp_verified', False),
        'offered_driver_id': str(ride['offered_driver_id']) if ride.get('offered_driver_id') else None,
        'rejected_drivers': [str(d_id) for d_id in ride.get('rejected_drivers', [])],
        'created_at': ride['created_at'].isoformat() if ride.get('created_at') else None,
        'updated_at': ride['updated_at'].isoformat() if ride.get('updated_at') else None,
    }
