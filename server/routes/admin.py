"""Admin routes — dashboard, user/driver/ride management, document verification."""

from flask import Blueprint, request, jsonify, current_app, g


from models.user import get_all_users, count_users, serialize_user
from models.driver import (
    get_all_drivers, count_drivers, approve_driver, reject_driver,
    serialize_driver, find_driver_by_id, DOCUMENT_TYPES,
    set_document_status, get_documents_for_admin
)
from models.ride import get_all_rides, count_rides, serialize_ride
from middleware.auth import admin_required

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def dashboard():
    """Get dashboard statistics."""
    db = current_app.config['db']

    total_users = count_users(db)
    total_drivers = count_drivers(db)
    total_rides = count_rides(db)
    pending_drivers = db.drivers.count_documents({'is_approved': False})
    active_rides = db.rides.count_documents({'status': {'$in': ['requested', 'accepted', 'started']}})
    completed_rides = db.rides.count_documents({'status': 'completed'})
    pending_docs = db.drivers.count_documents({'docs_verification_status': 'pending'})

    return jsonify({
        'stats': {
            'total_users': total_users,
            'total_drivers': total_drivers,
            'total_rides': total_rides,
            'pending_drivers': pending_drivers,
            'pending_docs': pending_docs,
            'active_rides': active_rides,
            'completed_rides': completed_rides,
        }
    }), 200


@admin_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    """List all registered users."""
    db = current_app.config['db']
    users = get_all_users(db)
    return jsonify({'users': [serialize_user(u) for u in users]}), 200


@admin_bp.route('/drivers', methods=['GET'])
@admin_required
def list_drivers():
    """List all registered drivers with document status summaries."""
    db = current_app.config['db']
    drivers = get_all_drivers(db)
    return jsonify({'drivers': [serialize_driver(d, include_documents=True) for d in drivers]}), 200


@admin_bp.route('/drivers/<driver_id>/approve', methods=['PUT'])
@admin_required
def approve(driver_id):
    """Approve a driver registration."""
    db = current_app.config['db']
    driver = db.drivers.find_one({'_id': str(driver_id)})
    if not driver:
        return jsonify({'error': 'Driver not found'}), 404
    approve_driver(db, driver_id)
    return jsonify({'message': 'Driver approved successfully'}), 200


@admin_bp.route('/drivers/<driver_id>/reject', methods=['PUT'])
@admin_required
def reject(driver_id):
    """Reject a driver registration."""
    db = current_app.config['db']
    driver = db.drivers.find_one({'_id': str(driver_id)})
    if not driver:
        return jsonify({'error': 'Driver not found'}), 404
    reject_driver(db, driver_id)
    return jsonify({'message': 'Driver rejected'}), 200


@admin_bp.route('/drivers/<driver_id>/documents', methods=['GET'])
@admin_required
def get_driver_documents(driver_id):
    """Return all documents (with base64) for admin review."""
    db = current_app.config['db']
    docs = get_documents_for_admin(db, driver_id)
    if docs is None:
        return jsonify({'error': 'Driver not found'}), 404
    driver = find_driver_by_id(db, driver_id)
    return jsonify({
        'driver': serialize_driver(driver),
        'documents': docs,
    }), 200


@admin_bp.route('/drivers/<driver_id>/documents/<doc_type>', methods=['PUT'])
@admin_required
def update_document_status(driver_id, doc_type):
    """Admin approves or rejects a specific document."""
    if doc_type not in DOCUMENT_TYPES:
        return jsonify({'error': f'Invalid document type. Must be one of: {", ".join(DOCUMENT_TYPES)}'}), 400

    data = request.get_json()
    status = data.get('status')
    if status not in ('verified', 'rejected', 'pending'):
        return jsonify({'error': 'status must be "verified", "rejected", or "pending"'}), 400

    db = current_app.config['db']
    driver = db.drivers.find_one({'_id': str(driver_id)})
    if not driver:
        return jsonify({'error': 'Driver not found'}), 404

    set_document_status(db, driver_id, doc_type, status)

    # Recompute overall docs_verification_status
    updated_driver = find_driver_by_id(db, driver_id)
    docs = updated_driver.get('documents', {})
    statuses = [docs.get(dt, {}).get('status', 'not_uploaded') for dt in DOCUMENT_TYPES]
    if all(s == 'verified' for s in statuses):
        overall = 'verified'
    elif any(s == 'rejected' for s in statuses):
        overall = 'rejected'
    else:
        overall = 'pending'

    db.drivers.update_one(
        {'_id': str(driver_id)},
        {'$set': {'docs_verification_status': overall}}
    )

    return jsonify({
        'message': f'{doc_type} status updated to {status}',
        'docs_verification_status': overall,
    }), 200


@admin_bp.route('/rides', methods=['GET'])
@admin_required
def list_rides():
    """List all rides."""
    db = current_app.config['db']
    rides = get_all_rides(db)

    result = []
    for ride in rides:
        ride_data = serialize_ride(ride)
        # Enrich with names
        user = db.users.find_one({'_id': ride['user_id']})
        ride_data['user_name'] = user['name'] if user else 'Unknown'
        if ride.get('driver_id'):
            driver = db.drivers.find_one({'_id': ride['driver_id']})
            ride_data['driver_name'] = driver['name'] if driver else 'Unknown'
        result.append(ride_data)

    return jsonify({'rides': result}), 200
