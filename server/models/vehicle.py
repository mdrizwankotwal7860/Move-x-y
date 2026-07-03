"""Vehicle model — helper functions for the 'vehicles' MongoDB collection."""

from datetime import datetime
import uuid



def create_vehicle(db, data):
    """Insert a new vehicle document and return its ID."""
    vehicle = {
        '_id': str(uuid.uuid4()),
        'driver_id': str(data['driver_id']),
        'make': data['make'],
        'model': data['model'],
        'year': int(data.get('year', 2020)),
        'color': data.get('color', ''),
        'plate_number': data['plate_number'].upper().strip(),
        'vehicle_type': data.get('vehicle_type', 'sedan'),
        'created_at': datetime.utcnow(),
    }
    result = db.vehicles.insert_one(vehicle)
    return result.inserted_id


def find_vehicle_by_driver(db, driver_id):
    """Return the vehicle belonging to a specific driver."""
    return db.vehicles.find_one({'driver_id': str(driver_id)})


def find_vehicle_by_id(db, vehicle_id):
    """Return a single vehicle by its ObjectId."""
    return db.vehicles.find_one({'_id': str(vehicle_id)})


def update_vehicle(db, driver_id, data):
    """Update vehicle details for a driver."""
    allowed = {'make', 'model', 'year', 'color', 'plate_number', 'vehicle_type'}
    update_data = {k: v for k, v in data.items() if k in allowed}
    if 'year' in update_data:
        update_data['year'] = int(update_data['year'])
    if 'plate_number' in update_data:
        update_data['plate_number'] = update_data['plate_number'].upper().strip()
    if update_data:
        db.vehicles.update_one(
            {'driver_id': str(driver_id)},
            {'$set': update_data}
        )
    return find_vehicle_by_driver(db, driver_id)


def serialize_vehicle(vehicle):
    """Convert a vehicle document to a JSON-safe dict."""
    if not vehicle:
        return None
    return {
        'id': str(vehicle['_id']),
        'driver_id': str(vehicle['driver_id']),
        'make': vehicle['make'],
        'model': vehicle['model'],
        'year': vehicle.get('year', 2020),
        'color': vehicle.get('color', ''),
        'plate_number': vehicle['plate_number'],
        'vehicle_type': vehicle.get('vehicle_type', 'sedan'),
    }
