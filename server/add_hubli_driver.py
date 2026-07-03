import os, datetime
from pymongo import MongoClient
import bcrypt, uuid
from dotenv import load_dotenv
import certifi

load_dotenv()
mongo_uri = os.getenv('MONGO_URI')

if not mongo_uri:
    print("Error: MONGO_URI not found in .env")
    exit(1)

print(f"Connecting to MongoDB...")
client = MongoClient(mongo_uri, tlsCAFile=certifi.where())
db = client['uber_clone']

# Remove any existing Hubli driver first to avoid duplicates
existing = db.drivers.find_one({'email': 'hubli@test.com'})
if existing:
    db.vehicles.delete_many({'driver_id': existing['_id']})
    db.drivers.delete_one({'email': 'hubli@test.com'})

driver = {
    '_id': str(uuid.uuid4()),
    'name': 'Hubli Driver',
    'email': 'hubli@test.com',
    'password': bcrypt.hashpw('driver123'.encode('utf-8'), bcrypt.gensalt()),
    'phone': '9998887776',
    'role': 'driver',
    'is_approved': True,
    'is_online': True,
    'current_location': {'lat': 15.3647, 'lng': 75.1240},
    'documents': {
        'license': {'status': 'verified', 'data': 'dummy', 'uploaded_at': datetime.datetime.now(datetime.UTC).isoformat()},
        'aadhaar': {'status': 'verified', 'data': 'dummy', 'uploaded_at': datetime.datetime.now(datetime.UTC).isoformat()},
        'rc': {'status': 'verified', 'data': 'dummy', 'uploaded_at': datetime.datetime.now(datetime.UTC).isoformat()},
        'insurance': {'status': 'verified', 'data': 'dummy', 'uploaded_at': datetime.datetime.now(datetime.UTC).isoformat()},
        'driver_photo': {'status': 'verified', 'data': 'dummy', 'uploaded_at': datetime.datetime.now(datetime.UTC).isoformat()},
        'vehicle_photo': {'status': 'verified', 'data': 'dummy', 'uploaded_at': datetime.datetime.now(datetime.UTC).isoformat()}
    },
    'docs_verification_status': 'verified',
    'created_at': datetime.datetime.now(datetime.UTC)
}

db.drivers.insert_one(driver)

vehicle = {
    '_id': str(uuid.uuid4()),
    'driver_id': driver['_id'],
    'make': 'Tata',
    'model': 'Nexon',
    'year': 2023,
    'color': 'Blue',
    'plate_number': 'KA25AB1234',
    'vehicle_type': 'suv',
    'created_at': datetime.datetime.now(datetime.UTC)
}
db.vehicles.insert_one(vehicle)
print('Driver "Hubli Driver" created in Hubli successfully.')
print('You can now go back to the app and search for a ride from Hubli.')
