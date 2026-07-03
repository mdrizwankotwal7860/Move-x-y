"""User routes — profile management."""

from flask import Blueprint, request, jsonify, current_app, g


from models.user import find_user_by_id, update_user, serialize_user
from middleware.auth import user_required

user_bp = Blueprint('user', __name__)


@user_bp.route('/profile', methods=['GET'])
@user_required
def get_profile():
    """Get the current user's profile."""
    db = current_app.config['db']
    user = find_user_by_id(db, g.current_user['id'])
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': serialize_user(user)}), 200


@user_bp.route('/profile', methods=['PUT'])
@user_required
def update_profile():
    """Update the current user's profile."""
    db = current_app.config['db']
    data = request.get_json()
    user = update_user(db, g.current_user['id'], data)
    return jsonify({
        'message': 'Profile updated successfully',
        'user': serialize_user(user),
    }), 200
