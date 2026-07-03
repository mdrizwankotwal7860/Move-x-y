"""JWT authentication middleware and role-based decorators."""

from functools import wraps
from flask import jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt


def get_current_user_from_jwt():
    """Extract user identity from a valid JWT. Returns dict with id and role."""
    identity = get_jwt_identity()
    claims = get_jwt()
    return {
        'id': identity,
        'role': claims.get('role', 'user'),
    }


def role_required(allowed_roles):
    """Decorator factory: restrict access to specific roles."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            current = get_current_user_from_jwt()
            if current['role'] not in allowed_roles:
                return jsonify({'error': 'Access denied. Insufficient permissions.'}), 403
            g.current_user = current
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def user_required(fn):
    """Restrict access to users only."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current = get_current_user_from_jwt()
        if current['role'] != 'user':
            return jsonify({'error': 'Access denied. User role required.'}), 403
        g.current_user = current
        return fn(*args, **kwargs)
    return wrapper


def driver_required(fn):
    """Restrict access to drivers only."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current = get_current_user_from_jwt()
        if current['role'] != 'driver':
            return jsonify({'error': 'Access denied. Driver role required.'}), 403
        g.current_user = current
        return fn(*args, **kwargs)
    return wrapper


def admin_required(fn):
    """Restrict access to admins only."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current = get_current_user_from_jwt()
        if current['role'] != 'admin':
            return jsonify({'error': 'Access denied. Admin role required.'}), 403
        g.current_user = current
        return fn(*args, **kwargs)
    return wrapper


def any_authenticated(fn):
    """Allow any authenticated user regardless of role."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        current = get_current_user_from_jwt()
        g.current_user = current
        return fn(*args, **kwargs)
    return wrapper
