"""
Automated unit test for Sequential Ride Dispatching.
Tests distance calculation, closest driver allocation, rejections, and timeouts.
"""

import sys
import os


# Ensure server directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import mongomock
from routes.ride import dispatch_ride_sequential, check_ride_timeout


class MockSocketIO:
    """Mock Socket.IO interface to record emitted events."""
    def __init__(self):
        self.emits = []

    def emit(self, event, data, room):
        self.emits.append({
            'event': event,
            'data': data,
            'room': room
        })


def test_sequential_dispatch():
    print("--- STARTING SEQUENTIAL DISPATCH TEST ---")
    
    # 1. Setup mock database
    client = mongomock.MongoClient()
    db = client['uber_clone']
    
    # 2. Insert mock user
    user_id = db.users.insert_one({
        'name': 'Test Rider',
        'email': 'rider@test.com',
        'role': 'user'
    }).inserted_id

    # 3. Insert mock drivers at different distances
    # Pickup location: Bangalore Majestic (12.9779, 77.5724)
    # Driver A: Close (12.9790, 77.5730) ~ 0.13 km
    # Driver B: Medium (12.9900, 77.5800) ~ 1.58 km
    # Driver C: Far (13.0500, 77.6000) ~ 8.5 km
    
    driver_a_id = db.drivers.insert_one({
        'name': 'Driver A (Close)',
        'email': 'drivera@test.com',
        'is_approved': True,
        'is_online': True,
        'current_location': {'lat': 12.9790, 'lng': 77.5730}
    }).inserted_id

    driver_b_id = db.drivers.insert_one({
        'name': 'Driver B (Medium)',
        'email': 'driverb@test.com',
        'is_approved': True,
        'is_online': True,
        'current_location': {'lat': 12.9900, 'lng': 77.5800}
    }).inserted_id

    driver_c_id = db.drivers.insert_one({
        'name': 'Driver C (Far)',
        'email': 'driverc@test.com',
        'is_approved': True,
        'is_online': True,
        'current_location': {'lat': 13.0500, 'lng': 77.6000}
    }).inserted_id

    # 4. Create ride booking
    ride_id = db.rides.insert_one({
        'user_id': user_id,
        'driver_id': None,
        'pickup': {'lat': 12.9779, 'lng': 77.5724, 'address': 'Majestic Station'},
        'destination': {'lat': 12.9600, 'lng': 77.5000, 'address': 'Sub-urban Terminal'},
        'distance_km': 8.0,
        'fare': 150.0,
        'status': 'requested',
        'offered_driver_id': None,
        'rejected_drivers': []
    }).inserted_id

    socketio = MockSocketIO()

    # --- Phase 1: Initial Dispatch (Should offer to Driver A - Close) ---
    print("\nPhase 1: Running initial dispatch...")
    dispatch_ride_sequential(db, ride_id, socketio)
    
    ride = db.rides.find_one({'_id': ride_id})
    assert ride['offered_driver_id'] == driver_a_id, f"Expected Driver A, got {ride['offered_driver_id']}"
    assert len(socketio.emits) == 1
    assert socketio.emits[-1]['event'] == 'ride_requested'
    assert socketio.emits[-1]['room'] == str(driver_a_id)
    print("[PASS] Phase 1 passed: Ride correctly offered to closest Driver A.")

    # --- Phase 2: Offer Timeout for Driver A (Should offer to Driver B - Medium) ---
    print("\nPhase 2: Simulating timeout for Driver A...")
    check_ride_timeout(db, ride_id, driver_a_id, socketio)
    
    ride = db.rides.find_one({'_id': ride_id})
    assert driver_a_id in ride['rejected_drivers']
    assert ride['offered_driver_id'] == driver_b_id, f"Expected Driver B, got {ride['offered_driver_id']}"
    assert socketio.emits[-2]['event'] == 'ride_withdrawn'
    assert socketio.emits[-2]['room'] == str(driver_a_id)
    assert socketio.emits[-1]['event'] == 'ride_requested'
    assert socketio.emits[-1]['room'] == str(driver_b_id)
    print("[PASS] Phase 2 passed: Driver A timed out; offer successfully passed to Driver B.")

    # --- Phase 3: Driver B rejects the ride (Should offer to Driver C - Far) ---
    print("\nPhase 3: Simulating explicit rejection by Driver B...")
    # Add to rejections and clear offer (mimics /reject route)
    db.rides.update_one(
        {'_id': ride_id},
        {
            '$push': {'rejected_drivers': driver_b_id},
            '$set': {'offered_driver_id': None}
        }
    )
    dispatch_ride_sequential(db, ride_id, socketio)
    
    ride = db.rides.find_one({'_id': ride_id})
    assert driver_b_id in ride['rejected_drivers']
    assert ride['offered_driver_id'] == driver_c_id, f"Expected Driver C, got {ride['offered_driver_id']}"
    assert socketio.emits[-1]['event'] == 'ride_requested'
    assert socketio.emits[-1]['room'] == str(driver_c_id)
    print("[PASS] Phase 3 passed: Driver B rejected; offer successfully passed to Driver C.")

    # --- Phase 4: Driver C times out (Should notify rider that no drivers are available) ---
    print("\nPhase 4: Simulating timeout for Driver C...")
    check_ride_timeout(db, ride_id, driver_c_id, socketio)
    
    ride = db.rides.find_one({'_id': ride_id})
    assert driver_c_id in ride['rejected_drivers']
    assert ride['offered_driver_id'] is None
    assert socketio.emits[-1]['event'] == 'no_drivers_available'
    assert socketio.emits[-1]['room'] == str(user_id)
    print("[PASS] Phase 4 passed: Driver C timed out; passenger correctly notified of no drivers available.")
    print("\n[SUCCESS] ALL SEQUENTIAL DISPATCH UNIT TESTS PASSED SUCCESSFULLY! [SUCCESS]")


if __name__ == '__main__':
    test_sequential_dispatch()
