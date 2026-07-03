"""
Seed script — Populate MongoDB with sample data for testing.

Run:  python seed.py

Creates:
  - 1 Admin account
  - 3 Users
  - 3 Drivers (2 approved, 1 pending)
  - 3 Vehicles
  - 5 Rides (various statuses)
  - 3 Ratings
"""

from pymongo import MongoClient
from datetime import datetime, timedelta

import bcrypt
import uuid

from config import Config


def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())


def seed():
    client = MongoClient(Config.MONGO_URI)
    db = client.get_default_database()
    if db is None:
        db = client['uber_clone']

    # ── Clear existing data ────────────────────────────────────
    print('🗑️  Clearing existing data...')
    db.users.drop()
    db.drivers.drop()
    db.vehicles.drop()
    db.rides.drop()
    db.ratings.drop()
    db.admins.drop()

    # ── Create indexes ─────────────────────────────────────────
    db.users.create_index('email', unique=True)
    db.drivers.create_index('email', unique=True)
    db.admins.create_index('email', unique=True)
    db.vehicles.create_index('plate_number', unique=True)

    # ── Admin ──────────────────────────────────────────────────
    print('👑  Creating admin...')
    admin_id = db.admins.insert_one({'_id': str(uuid.uuid4()),
        'name': 'Admin User',
        'email': 'admin@uberclone.com',
        'password': hash_password('admin123'),
        'role': 'admin',
        'created_at': datetime.utcnow(),
    }).inserted_id

    # ── Users ──────────────────────────────────────────────────
    print('👤  Creating users...')
    user_ids = []
    users_data = [
        {'name': 'Rahul Sharma', 'email': 'rahul@test.com', 'phone': '9876543210'},
        {'name': 'Priya Patel', 'email': 'priya@test.com', 'phone': '9876543211'},
        {'name': 'Amit Kumar', 'email': 'amit@test.com', 'phone': '9876543212'},
    ]
    for u in users_data:
        uid = db.users.insert_one({'_id': str(uuid.uuid4()),
            'name': u['name'],
            'email': u['email'],
            'password': hash_password('user123'),
            'phone': u['phone'],
            'role': 'user',
            'created_at': datetime.utcnow(),
        }).inserted_id
        user_ids.append(uid)

    # ── Drivers ────────────────────────────────────────────────
    print('🚗  Creating drivers...')
    driver_ids = []
    drivers_data = [
        {
            'name': 'Suresh Reddy', 'email': 'suresh@test.com', 'phone': '9876543220',
            'is_approved': True, 'is_online': True,
            'current_location': {'lat': 12.9716, 'lng': 77.5946},  # Bangalore
        },
        {
            'name': 'Vikram Singh', 'email': 'vikram@test.com', 'phone': '9876543221',
            'is_approved': True, 'is_online': False,
            'current_location': {'lat': 12.9352, 'lng': 77.6245},
        },
        {
            'name': 'Ravi Teja', 'email': 'ravi@test.com', 'phone': '9876543222',
            'is_approved': False, 'is_online': False,
            'current_location': {'lat': 12.9611, 'lng': 77.6387},
        },
    ]
    for d in drivers_data:
        did = db.drivers.insert_one({'_id': str(uuid.uuid4()),
            'name': d['name'],
            'email': d['email'],
            'password': hash_password('driver123'),
            'phone': d['phone'],
            'role': 'driver',
            'is_approved': d['is_approved'],
            'is_online': d['is_online'],
            'current_location': d['current_location'],
            'created_at': datetime.utcnow(),
        }).inserted_id
        driver_ids.append(did)

    # ── Vehicles ───────────────────────────────────────────────
    print('🚙  Creating vehicles...')
    vehicles_data = [
        {'driver_id': driver_ids[0], 'make': 'Maruti', 'model': 'Swift', 'year': 2022, 'color': 'White', 'plate_number': 'KA01AB1234', 'vehicle_type': 'hatchback'},
        {'driver_id': driver_ids[1], 'make': 'Hyundai', 'model': 'Creta', 'year': 2023, 'color': 'Black', 'plate_number': 'KA02CD5678', 'vehicle_type': 'suv'},
        {'driver_id': driver_ids[2], 'make': 'Toyota', 'model': 'Etios', 'year': 2021, 'color': 'Silver', 'plate_number': 'KA03EF9012', 'vehicle_type': 'sedan'},
    ]
    for v in vehicles_data:
        db.vehicles.insert_one({'_id': str(uuid.uuid4()),
            'driver_id': v['driver_id'],
            'make': v['make'],
            'model': v['model'],
            'year': v['year'],
            'color': v['color'],
            'plate_number': v['plate_number'],
            'vehicle_type': v['vehicle_type'],
            'created_at': datetime.utcnow(),
        })

    # ── Rides ──────────────────────────────────────────────────
    print('📍  Creating rides...')
    ride_ids = []
    rides_data = [
        {
            'user_id': user_ids[0], 'driver_id': driver_ids[0],
            'pickup': {'lat': 12.9716, 'lng': 77.5946, 'address': 'MG Road, Bangalore'},
            'destination': {'lat': 12.9352, 'lng': 77.6245, 'address': 'Koramangala, Bangalore'},
            'distance_km': 5.2, 'fare': 128.0, 'status': 'completed',
        },
        {
            'user_id': user_ids[0], 'driver_id': driver_ids[1],
            'pickup': {'lat': 12.9784, 'lng': 77.6408, 'address': 'Indiranagar, Bangalore'},
            'destination': {'lat': 13.0358, 'lng': 77.5970, 'address': 'Yeshwanthpur, Bangalore'},
            'distance_km': 8.7, 'fare': 180.5, 'status': 'completed',
        },
        {
            'user_id': user_ids[1], 'driver_id': driver_ids[0],
            'pickup': {'lat': 12.9611, 'lng': 77.6387, 'address': 'Whitefield, Bangalore'},
            'destination': {'lat': 12.9716, 'lng': 77.5946, 'address': 'MG Road, Bangalore'},
            'distance_km': 6.1, 'fare': 141.5, 'status': 'completed',
        },
        {
            'user_id': user_ids[1], 'driver_id': driver_ids[0],
            'pickup': {'lat': 12.9250, 'lng': 77.5897, 'address': 'Jayanagar, Bangalore'},
            'destination': {'lat': 12.9784, 'lng': 77.6408, 'address': 'Indiranagar, Bangalore'},
            'distance_km': 7.3, 'fare': 159.5, 'status': 'started',
        },
        {
            'user_id': user_ids[2], 'driver_id': None,
            'pickup': {'lat': 13.0358, 'lng': 77.5970, 'address': 'Yeshwanthpur, Bangalore'},
            'destination': {'lat': 12.9352, 'lng': 77.6245, 'address': 'Koramangala, Bangalore'},
            'distance_km': 12.4, 'fare': 236.0, 'status': 'requested',
        },
    ]
    for r in rides_data:
        rid = db.rides.insert_one({'_id': str(uuid.uuid4()),
            'user_id': r['user_id'],
            'driver_id': r['driver_id'],
            'pickup': r['pickup'],
            'destination': r['destination'],
            'distance_km': r['distance_km'],
            'fare': r['fare'],
            'status': r['status'],
            'created_at': datetime.utcnow() - timedelta(hours=len(ride_ids)),
            'updated_at': datetime.utcnow(),
        }).inserted_id
        ride_ids.append(rid)

    # ── Ratings ────────────────────────────────────────────────
    print('⭐  Creating ratings...')
    ratings_data = [
        {'ride_id': ride_ids[0], 'user_id': user_ids[0], 'driver_id': driver_ids[0], 'rating': 5, 'review': 'Excellent driver! Very safe and punctual.'},
        {'ride_id': ride_ids[1], 'user_id': user_ids[0], 'driver_id': driver_ids[1], 'rating': 4, 'review': 'Good ride, slightly long route.'},
        {'ride_id': ride_ids[2], 'user_id': user_ids[1], 'driver_id': driver_ids[0], 'rating': 5, 'review': 'Very polite and professional driver.'},
    ]
    for rt in ratings_data:
        db.ratings.insert_one({'_id': str(uuid.uuid4()),
            'ride_id': rt['ride_id'],
            'user_id': rt['user_id'],
            'driver_id': rt['driver_id'],
            'rating': rt['rating'],
            'review': rt['review'],
            'created_at': datetime.utcnow(),
        })

    # ── Summary ────────────────────────────────────────────────
    print()
    print('=' * 50)
    print('  ✅  Database seeded successfully!')
    print('=' * 50)
    print()
    print('  📋  Sample Credentials:')
    print('  ─────────────────────────────')
    print('  Admin:  admin@uberclone.com / admin123')
    print('  User:   rahul@test.com / user123')
    print('  User:   priya@test.com / user123')
    print('  User:   amit@test.com / user123')
    print('  Driver: suresh@test.com / driver123 (approved)')
    print('  Driver: vikram@test.com / driver123 (approved)')
    print('  Driver: ravi@test.com / driver123 (pending)')
    print()


if __name__ == '__main__':
    seed()
