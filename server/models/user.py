import uuid
"""User model — helper functions for the 'users' MongoDB collection."""

from datetime import datetime

import bcrypt


def create_user(db, data):
    """Insert a new user document and return its ID."""
    hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    user = {
        'name': data['name'],
        'email': data['email'].lower().strip(),
        'password': hashed,
        'phone': data.get('phone', ''),
        '_id': str(uuid.uuid4()),
        'role': 'user',
        'created_at': datetime.utcnow(),
    }
    result = db.users.insert_one(user)
    return result.inserted_id


def find_user_by_email(db, email):
    """Return a single user document matching the email."""
    return db.users.find_one({'email': email.lower().strip()})


def find_user_by_id(db, user_id):
    """Return a single user by its ObjectId."""
    return db.users.find_one({'_id': str(user_id)})


def update_user(db, user_id, data):
    """Update allowed fields on a user document."""
    allowed = {'name', 'phone'}
    update_data = {k: v for k, v in data.items() if k in allowed}
    if update_data:
        db.users.update_one({'_id': str(user_id)}, {'$set': update_data})
    return find_user_by_id(db, user_id)


def get_all_users(db):
    """Return every user document (admin use)."""
    return list(db.users.find({}, {'password': 0}))


def count_users(db):
    """Return total user count."""
    return db.users.count_documents({})


def serialize_user(user):
    """Convert a user document to a JSON-safe dict."""
    if not user:
        return None
    return {
        'id': str(user['_id']),
        'name': user['name'],
        'email': user['email'],
        'phone': user.get('phone', ''),
        'role': user.get('role', 'user'),
        'created_at': user['created_at'].isoformat() if user.get('created_at') else None,
    }
