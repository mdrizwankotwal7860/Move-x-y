"""Fare calculation utility using the Haversine formula for distance."""

import math
from config import Config


def haversine_distance(lat1, lng1, lat2, lng2):
    """
    Calculate the great-circle distance between two points
    on Earth using the Haversine formula.

    Returns distance in kilometers.
    """
    R = 6371  # Earth's radius in kilometers

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)

    a = (math.sin(dlat / 2) ** 2 +
         math.cos(lat1_rad) * math.cos(lat2_rad) *
         math.sin(dlng / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return round(R * c, 2)


def calculate_fare(distance_km):
    """
    Calculate the ride fare based on distance.

    Formula: max(MIN_FARE, BASE_FARE + distance_km * RATE_PER_KM)
    """
    fare = Config.BASE_FARE + (distance_km * Config.RATE_PER_KM)
    return round(max(fare, Config.MIN_FARE), 2)


def estimate_fare(pickup_lat, pickup_lng, dest_lat, dest_lng):
    """
    Estimate fare given pickup and destination coordinates.
    Returns dict with distance_km and fare.
    """
    distance = haversine_distance(pickup_lat, pickup_lng, dest_lat, dest_lng)
    fare = calculate_fare(distance)
    return {
        'distance_km': distance,
        'fare': fare,
    }
