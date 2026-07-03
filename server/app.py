"""
Uber Clone — Flask Backend Application
Main entry point. Initializes Flask, MongoDB, JWT, Socket.IO, and registers all route blueprints.
"""

import eventlet
eventlet.monkey_patch()

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from pymongo import MongoClient

from datetime import timedelta



from config import Config
from routes.auth import auth_bp
from routes.user import user_bp
from routes.driver import driver_bp
from routes.ride import ride_bp
from routes.rating import rating_bp
from routes.admin import admin_bp
from routes.documents import documents_bp
from sockets.ride_events import register_socket_events


def create_app():
    """Application factory — creates and configures the Flask app."""
    app = Flask(__name__)

    # ── Configuration ──────────────────────────────────────────
    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['JWT_SECRET_KEY'] = Config.JWT_SECRET_KEY
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(seconds=Config.JWT_ACCESS_TOKEN_EXPIRES)

    # ── CORS ───────────────────────────────────────────────────
    CORS(app, resources={r"/api/*": {"origins": Config.CORS_ORIGINS}},
         supports_credentials=True)

    # ── MongoDB ────────────────────────────────────────────────
    db = _connect_db()
    app.config['db'] = db

    # Create indexes for unique fields (deferred — safe if MongoDB not yet ready)
    try:
        db.users.create_index('email', unique=True)
        db.drivers.create_index('email', unique=True)
        db.admins.create_index('email', unique=True)
        db.vehicles.create_index('plate_number', unique=True)
        db.gps_history.create_index('ride_id')
        print('  [OK] MongoDB indexes created/verified')
    except Exception as e:
        print(f'  [!]  MongoDB index creation skipped: {e}')

    # ── JWT ─────────────────────────────────────────────────────
    jwt = JWTManager(app)

    # ── Socket.IO ──────────────────────────────────────────────
    socketio = SocketIO(app, cors_allowed_origins="*")
    app.config['socketio'] = socketio
    register_socket_events(socketio)

    # ── Register Blueprints ────────────────────────────────────
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(driver_bp, url_prefix='/api/drivers')
    app.register_blueprint(ride_bp, url_prefix='/api/rides')
    app.register_blueprint(rating_bp, url_prefix='/api/ratings')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(documents_bp, url_prefix='/api/drivers/documents')

    # ── Health Check ───────────────────────────────────────────
    @app.route('/api/health', methods=['GET'])
    def health():
        return {'status': 'ok', 'message': 'Uber Clone API is running'}, 200

    print('=' * 50)
    print('  Uber Clone API Server')
    print(f'  MongoDB: {Config.MONGO_URI}')
    print(f'  JWT Expiry: {Config.JWT_ACCESS_TOKEN_EXPIRES}s')
    print('=' * 50)

    return app, socketio


def _connect_db():
    """Try to connect to real MongoDB; fall back to mongomock if unavailable."""
    import os

    # Check if mock mode is forced via env
    if os.getenv('USE_MOCK_DB', '').lower() in ('1', 'true', 'yes'):
        return _use_mock_db('Forced by USE_MOCK_DB env variable')

    # Try real MongoDB
    try:
        client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=3000)
        client.server_info()  # force connection check
        db = client.get_default_database()
        if db is None:
            db = client['uber_clone']
        print('  [OK] Connected to real MongoDB')
        return db
    except Exception as e:
        return _use_mock_db(str(e))


def _use_mock_db(reason):
    """Use montydb local persistent database as fallback."""
    try:
        import montydb
        import os
        
        db_path = os.path.join(os.path.dirname(__file__), 'local_db')
        client = montydb.MontyClient(db_path)
        db = client['uber_clone']
        
        print('=' * 50)
        print('  [OK] RUNNING WITH PERMANENT LOCAL DATABASE (MontyDB)')
        print(f'  [OK] Data will persist in: {db_path}')
        print('=' * 50)
        
        # Auto-seed a default admin and dummy ride for testing purposes
        import bcrypt
        from datetime import datetime
        import uuid
        
        if db.admins.count_documents({}) == 0:
            db.admins.insert_one({
                '_id': str(uuid.uuid4()),
                'name': 'Mock Admin',
                'email': 'admin@uberclone.com',
                'password': bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()),
                'role': 'admin',
                'created_at': datetime.utcnow(),
            })
            print('  [+] Auto-seeded default admin: admin@uberclone.com / admin123')
            
        if db.rides.count_documents({}) == 0:
            user_id = str(uuid.uuid4())
            db.users.insert_one({
                '_id': user_id,
                'name': 'Sample Passenger',
                'email': 'passenger@uberclone.com',
                'password': bcrypt.hashpw('user123'.encode('utf-8'), bcrypt.gensalt()),
                'phone': '9876543210',
                'role': 'user',
                'created_at': datetime.utcnow(),
            })
            
            db.rides.insert_one({
                '_id': str(uuid.uuid4()),
                'user_id': user_id,
                'driver_id': None,
                'pickup': {'lat': 12.9716, 'lng': 77.5946, 'address': 'MG Road, Bangalore'},
                'destination': {'lat': 12.9352, 'lng': 77.6245, 'address': 'Koramangala, Bangalore'},
                'distance_km': 5.2,
                'fare': 128.0,
                'status': 'requested',
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
            })
            print('  [+] Auto-seeded sample pending ride request for drivers to accept.')

        return db
    except ImportError:
        print('  [X] montydb not installed. Run: pip install montydb')
        raise
# Expose global app and socketio for WSGI servers like Gunicorn
app, socketio = create_app()

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=True)
