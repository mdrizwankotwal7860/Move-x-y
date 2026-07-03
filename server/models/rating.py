"""Rating model — helper functions for the 'ratings' MongoDB collection."""

from datetime import datetime



import uuid

def create_rating(db, data):
    """Insert a new rating document and return its ID."""
    rating = {
        '_id': str(uuid.uuid4()),
        'ride_id': str(data['ride_id']),
        'user_id': str(data['user_id']),
        'driver_id': str(data['driver_id']),
        'rating': int(data['rating']),
        'review': data.get('review', ''),
        'created_at': datetime.utcnow(),
    }
    result = db.ratings.insert_one(rating)
    return result.inserted_id


def get_driver_ratings(db, driver_id):
    """Return all ratings for a specific driver."""
    return list(db.ratings.find({'driver_id': str(driver_id)}).sort('created_at', -1))


def get_driver_avg_rating(db, driver_id):
    """Calculate the average rating for a driver."""
    ratings = list(db.ratings.find({'driver_id': str(driver_id)}))
    count = len(ratings)
    if count == 0:
        return {'avg_rating': 0, 'count': 0}
        
    total_score = sum(r.get('rating', 0) for r in ratings)
    avg_rating = round(total_score / count, 1)
    
    return {'avg_rating': avg_rating, 'count': count}


def find_rating_by_ride(db, ride_id):
    """Check if a rating already exists for a ride."""
    return db.ratings.find_one({'ride_id': str(ride_id)})


def serialize_rating(rating):
    """Convert a rating document to a JSON-safe dict."""
    if not rating:
        return None
    return {
        'id': str(rating['_id']),
        'ride_id': str(rating['ride_id']),
        'user_id': str(rating['user_id']),
        'driver_id': str(rating['driver_id']),
        'rating': rating['rating'],
        'review': rating.get('review', ''),
        'created_at': rating['created_at'].isoformat() if rating.get('created_at') else None,
    }
