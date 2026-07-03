import uuid
"""Driver model — helper functions for the 'drivers' MongoDB collection."""

from datetime import datetime

import bcrypt


DOCUMENT_TYPES = ['license', 'aadhaar', 'rc', 'insurance', 'driver_photo', 'vehicle_photo']


def _empty_documents():
    """Return a fresh documents sub-document."""
    return {dt: {'data': None, 'status': 'not_uploaded', 'uploaded_at': None}
            for dt in DOCUMENT_TYPES}


def create_driver(db, data):
    """Insert a new driver document and return its ID."""
    hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    driver = {
        'name': data['name'],
        'email': data['email'].lower().strip(),
        'password': hashed,
        'phone': data.get('phone', ''),
        'role': 'driver',
        'is_approved': False,
        'is_online': False,
        'current_location': data.get('current_location', {'lat': 12.9716, 'lng': 77.5946}),
        '_id': str(uuid.uuid4()),
        'documents': _empty_documents(),
        'docs_verification_status': 'pending',  # pending | verified | rejected
        'created_at': datetime.utcnow(),
    }
    result = db.drivers.insert_one(driver)
    return result.inserted_id


def find_driver_by_email(db, email):
    """Return a single driver document matching the email."""
    return db.drivers.find_one({'email': email.lower().strip()})


def find_driver_by_id(db, driver_id):
    """Return a single driver by its ObjectId."""
    return db.drivers.find_one({'_id': str(driver_id)})


def update_driver(db, driver_id, data):
    """Update allowed fields on a driver document."""
    allowed = {'name', 'phone', 'is_online', 'current_location'}
    update_data = {k: v for k, v in data.items() if k in allowed}
    if update_data:
        db.drivers.update_one({'_id': str(driver_id)}, {'$set': update_data})
    return find_driver_by_id(db, driver_id)


def set_driver_status(db, driver_id, is_online):
    """Toggle the driver's online/offline status."""
    db.drivers.update_one(
        {'_id': str(driver_id)},
        {'$set': {'is_online': is_online}}
    )


def update_driver_location(db, driver_id, lat, lng):
    """Update the driver's current GPS location."""
    db.drivers.update_one(
        {'_id': str(driver_id)},
        {'$set': {'current_location': {'lat': lat, 'lng': lng}}}
    )


def approve_driver(db, driver_id):
    """Admin approves a driver registration."""
    db.drivers.update_one(
        {'_id': str(driver_id)},
        {'$set': {'is_approved': True, 'docs_verification_status': 'verified'}}
    )


def reject_driver(db, driver_id):
    """Admin rejects a driver registration."""
    db.drivers.update_one(
        {'_id': str(driver_id)},
        {'$set': {'is_approved': False, 'docs_verification_status': 'rejected'}}
    )


def upload_document(db, driver_id, doc_type, base64_data):
    """Store a base64-encoded document for a driver."""
    db.drivers.update_one(
        {'_id': str(driver_id)},
        {'$set': {
            f'documents.{doc_type}.data': base64_data,
            f'documents.{doc_type}.status': 'pending',
            f'documents.{doc_type}.uploaded_at': datetime.utcnow().isoformat(),
        }}
    )


def set_document_status(db, driver_id, doc_type, status):
    """Admin sets the status (pending|verified|rejected) for one document."""
    db.drivers.update_one(
        {'_id': str(driver_id)},
        {'$set': {f'documents.{doc_type}.status': status}}
    )


def get_all_drivers(db):
    """Return every driver document (admin use)."""
    return list(db.drivers.find({}, {'password': 0}))


def get_available_drivers(db):
    """Return drivers who are approved and online."""
    return list(db.drivers.find(
        {'is_approved': True, 'is_online': True},
        {'password': 0}
    ))


def count_drivers(db):
    """Return total driver count."""
    return db.drivers.count_documents({})


def serialize_driver(driver, include_documents=False):
    """Convert a driver document to a JSON-safe dict."""
    if not driver:
        return None
    data = {
        'id': str(driver['_id']),
        'name': driver['name'],
        'email': driver['email'],
        'phone': driver.get('phone', ''),
        'role': driver.get('role', 'driver'),
        'is_approved': driver.get('is_approved', False),
        'is_online': driver.get('is_online', False),
        'current_location': driver.get('current_location', {'lat': 0, 'lng': 0}),
        'docs_verification_status': driver.get('docs_verification_status', 'pending'),
        'created_at': driver['created_at'].isoformat() if driver.get('created_at') else None,
    }
    if include_documents:
        # Strip raw base64 data from the list view; include statuses only
        docs = driver.get('documents', {})
        data['documents'] = {
            dt: {
                'status': docs.get(dt, {}).get('status', 'not_uploaded'),
                'uploaded_at': docs.get(dt, {}).get('uploaded_at'),
                # Include data only when explicitly requested (admin full view)
                'has_file': bool(docs.get(dt, {}).get('data')),
            }
            for dt in DOCUMENT_TYPES
        }
    return data


def get_documents_for_admin(db, driver_id):
    """Return driver documents with base64 data for admin review."""
    driver = find_driver_by_id(db, driver_id)
    if not driver:
        return None
    docs = driver.get('documents', {})
    return {
        dt: {
            'status': docs.get(dt, {}).get('status', 'not_uploaded'),
            'uploaded_at': docs.get(dt, {}).get('uploaded_at'),
            'data': docs.get(dt, {}).get('data'),  # full base64 for admin
        }
        for dt in DOCUMENT_TYPES
    }
