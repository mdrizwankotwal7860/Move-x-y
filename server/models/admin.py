import uuid
"""Admin model — helper functions for the 'admins' MongoDB collection."""

from datetime import datetime

import bcrypt


def create_admin(db, data):
    """Insert a new admin document and return its ID."""
    hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    admin = {
        'name': data['name'],
        'email': data['email'].lower().strip(),
        'password': hashed,
        '_id': str(uuid.uuid4()),
        'role': 'admin',
        'created_at': datetime.utcnow(),
    }
    result = db.admins.insert_one(admin)
    return result.inserted_id


def find_admin_by_email(db, email):
    """Return a single admin document matching the email."""
    return db.admins.find_one({'email': email.lower().strip()})


def find_admin_by_id(db, admin_id):
    """Return a single admin by its ObjectId."""
    return db.admins.find_one({'_id': str(admin_id)})


def serialize_admin(admin):
    """Convert an admin document to a JSON-safe dict."""
    if not admin:
        return None
    return {
        'id': str(admin['_id']),
        'name': admin['name'],
        'email': admin['email'],
        '_id': str(uuid.uuid4()),
        'role': 'admin',
        'created_at': admin['created_at'].isoformat() if admin.get('created_at') else None,
    }
