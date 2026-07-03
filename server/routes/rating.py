"""Rating routes — submit and view driver ratings."""

from flask import Blueprint, request, jsonify, current_app, g


from models.rating import (
    create_rating, get_driver_ratings, get_driver_avg_rating,
    find_rating_by_ride, serialize_rating
)
from models.ride import find_ride_by_id
from middleware.auth import user_required, any_authenticated

rating_bp = Blueprint('rating', __name__)


@rating_bp.route('/', methods=['POST'])
@user_required
def submit_rating():
    """Submit a rating for a completed ride."""
    data = request.get_json()
    db = current_app.config['db']

    ride_id = data.get('ride_id')
    rating_value = data.get('rating')

    if not ride_id or not rating_value:
        return jsonify({'error': 'ride_id and rating are required'}), 400

    if int(rating_value) < 1 or int(rating_value) > 5:
        return jsonify({'error': 'Rating must be between 1 and 5'}), 400

    # Verify ride exists and is completed
    ride = find_ride_by_id(db, ride_id)
    if not ride:
        return jsonify({'error': 'Ride not found'}), 404
    if ride['status'] != 'completed':
        return jsonify({'error': 'Can only rate completed rides'}), 400
    if str(ride['user_id']) != g.current_user['id']:
        return jsonify({'error': 'You can only rate your own rides'}), 403

    # Check if already rated
    existing = find_rating_by_ride(db, ride_id)
    if existing:
        return jsonify({'error': 'You have already rated this ride'}), 409

    rating_data = {
        'ride_id': ride_id,
        'user_id': g.current_user['id'],
        'driver_id': str(ride['driver_id']),
        'rating': int(rating_value),
        'review': data.get('review', ''),
    }

    rating_id = create_rating(db, rating_data)
    rating = db.ratings.find_one({'_id': rating_id})

    return jsonify({
        'message': 'Rating submitted successfully',
        'rating': serialize_rating(rating),
    }), 201


@rating_bp.route('/driver/<driver_id>', methods=['GET'])
@any_authenticated
def get_ratings(driver_id):
    """Get all ratings for a specific driver."""
    db = current_app.config['db']
    ratings = get_driver_ratings(db, driver_id)
    avg = get_driver_avg_rating(db, driver_id)

    return jsonify({
        'ratings': [serialize_rating(r) for r in ratings],
        'average': avg,
    }), 200
