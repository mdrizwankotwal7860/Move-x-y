"""GPS history model — stores per-ride driver location trail."""

from datetime import datetime

import math


def _haversine(lat1, lng1, lat2, lng2):
    """Return distance in metres between two coordinates."""
    R = 6_371_000  # earth radius in metres
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def append_gps_point(db, ride_id, driver_id, lat, lng):
    """Append a GPS point to the ride's history document (upsert)."""
    point = {'lat': lat, 'lng': lng, 'ts': datetime.utcnow().isoformat()}
    db.gps_history.update_one(
        {'ride_id': str(ride_id)},
        {
            '$setOnInsert': {'driver_id': str(driver_id)},
            '$push': {'points': point},
        },
        upsert=True,
    )


def get_ride_gps_history(db, ride_id):
    """Return the GPS history document for a ride."""
    doc = db.gps_history.find_one({'ride_id': str(ride_id)})
    if not doc:
        return []
    return doc.get('points', [])


def distance_to_point_metres(db, ride_id, target_lat, target_lng):
    """
    Return distance (metres) from the latest GPS point in history to a target.
    Returns None if no history exists.
    """
    doc = db.gps_history.find_one({'ride_id': str(ride_id)})
    if not doc or not doc.get('points'):
        return None
    last = doc['points'][-1]
    return _haversine(last['lat'], last['lng'], target_lat, target_lng)
