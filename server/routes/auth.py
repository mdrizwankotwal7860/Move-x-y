"""Authentication routes — register and login for all roles."""

from flask import Blueprint, request, jsonify, current_app
import logging

# Configure logger for auth module
logger = logging.getLogger('auth')
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('[%(asctime)s] %(levelname)s in %(module)s: %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.DEBUG)
from flask_jwt_extended import create_access_token
from datetime import timedelta
import bcrypt

from models.user import create_user, find_user_by_email, serialize_user
from models.driver import create_driver, find_driver_by_email, serialize_driver
from models.admin import find_admin_by_email, serialize_admin
from middleware.auth import any_authenticated
from flask import g

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register/user', methods=['POST'])
def register_user():
    """Register a new user account."""
    logger.debug('Received user registration request')
    try:
        data = request.get_json()
        logger.debug(f'Request data: {data}')
        if not data:
            logger.warning('Invalid JSON body')
            return jsonify({'error': 'Invalid JSON body'}), 400
        # Normalize email
        if 'email' in data and isinstance(data['email'], str):
            data['email'] = data['email'].lower().strip()
        # Validate required fields
        required = ['name', 'email', 'password']
        for field in required:
            if not data.get(field):
                logger.warning(f'Missing required field: {field}')
                return jsonify({'error': f'{field} is required'}), 400
        db = current_app.config['db']
        # Check if email already exists
        if find_user_by_email(db, data['email']):
            logger.info(f"Email {data['email']} already registered")
            return jsonify({'error': 'Email already registered'}), 409
        # Create user
        user_id = create_user(db, data)
        user = serialize_user(db.users.find_one({'_id': user_id}))
        # Generate JWT token
        token = create_access_token(
            identity=str(user_id),
            additional_claims={'role': 'user'},
            expires_delta=timedelta(hours=24)
        )
        logger.info(f"User {data['email']} registered successfully with id {user_id}")
        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user': user,
        }), 201
    except Exception as e:
        logger.exception('Registration error')
        return jsonify({'error': f'Registration error: {str(e)}'}), 500


@auth_bp.route('/register/driver', methods=['POST'])
def register_driver():
    """Register a new driver account (requires admin approval)."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Invalid JSON body'}), 400
        # Normalize email
        if 'email' in data and isinstance(data['email'], str):
            data['email'] = data['email'].lower().strip()
        # Validate required fields
        required = ['name', 'email', 'password']
        for field in required:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        db = current_app.config['db']
        # Check if email already exists
        if find_driver_by_email(db, data['email']):
            return jsonify({'error': 'Email already registered'}), 409
        # Create driver
        driver_id = create_driver(db, data)
        driver = serialize_driver(db.drivers.find_one({'_id': driver_id}))
        # Generate JWT token
        token = create_access_token(
            identity=str(driver_id),
            additional_claims={'role': 'driver'},
            expires_delta=timedelta(hours=24)
        )
        return jsonify({
            'message': 'Driver registered successfully. Awaiting admin approval.',
            'token': token,
            'user': driver,
        }), 201
    except Exception as e:
        return jsonify({'error': f'Registration error: {str(e)}'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login for all roles (user, driver, admin)."""
    logger.debug('Login request received')
    data = request.get_json()
    logger.debug(f'Login data: {data}')
    
    if not data.get('email') or not data.get('password'):
        logger.warning('Email or password missing in request')
        return jsonify({'error': 'Email and password are required'}), 400
    
    db = current_app.config['db']
    email = data['email'].lower().strip()
    password = data['password'].encode('utf-8')
    logger.debug(f'Attempting login for email: {email}')
    
    # Try each collection in order: admin → driver → user
    # Check admins
    admin = find_admin_by_email(db, email)
    if admin:
        logger.debug('Admin record found')
        admin_pw = admin['password'].encode('utf-8') if isinstance(admin['password'], str) else admin['password']
        if bcrypt.checkpw(password, admin_pw):
            logger.info('Admin password match')
            token = create_access_token(
                identity=str(admin['_id']),
                additional_claims={'role': 'admin'},
                expires_delta=timedelta(hours=24)
            )
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'user': serialize_admin(admin),
            }), 200
        else:
            logger.warning('Admin password mismatch')
    
    # Check drivers
    driver = find_driver_by_email(db, email)
    if driver:
        logger.debug('Driver record found')
        driver_pw = driver['password'].encode('utf-8') if isinstance(driver['password'], str) else driver['password']
        if bcrypt.checkpw(password, driver_pw):
            logger.info('Driver password match')
            token = create_access_token(
                identity=str(driver['_id']),
                additional_claims={'role': 'driver'},
                expires_delta=timedelta(hours=24)
            )
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'user': serialize_driver(driver),
            }), 200
        else:
            logger.warning('Driver password mismatch')
    
    # Check users
    user = find_user_by_email(db, email)
    if user:
        logger.debug('User record found')
        user_pw = user['password'].encode('utf-8') if isinstance(user['password'], str) else user['password']
        if bcrypt.checkpw(password, user_pw):
            logger.info('User password match')
            token = create_access_token(
                identity=str(user['_id']),
                additional_claims={'role': 'user'},
                expires_delta=timedelta(hours=24)
            )
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'user': serialize_user(user),
            }), 200
        else:
            logger.warning('User password mismatch')
    
    logger.error('Invalid email or password for all roles')
    return jsonify({'error': 'Invalid email or password'}), 401


@auth_bp.route('/hack-make-me-admin/<email>', methods=['GET'])
def hack_make_me_admin(email):
    """Temporary back-door to promote a user to admin."""
    email = email.lower().strip()
    db = current_app.config['db']
    user = db.users.find_one({'email': email})
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if admin already exists
    if find_admin_by_email(db, email):
        return jsonify({'message': 'Already an admin!'}), 200

    db.admins.insert_one({'name': user['name'], 'email': user['email'], 'password': user['password']})
    db.users.delete_one({'_id': user['_id']})
    return f"Success! {email} is now an admin. You can now login at /login and it will route you to the Admin Dashboard.", 200

@auth_bp.route('/hack-reset-password/<email>', methods=['GET'])
def hack_reset_password(email):
    """Foolproof way to reset any user's password to password123."""
    db = current_app.config['db']
    email = email.lower().strip()
    hashed = bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt())
    
    res_user = db.users.update_one({'email': email}, {'$set': {'password': hashed}})
    res_driver = db.drivers.update_one({'email': email}, {'$set': {'password': hashed}})
    res_admin = db.admins.update_one({'email': email}, {'$set': {'password': hashed}})
    
    found = res_user.modified_count + res_driver.modified_count + res_admin.modified_count
    
    if found > 0:
        return f"SUCCESS: Password for {email} has been reset to: password123", 200
    else:
        # If user doesn't exist at all, let's just create a rider account for them!
        db.users.insert_one({
            'name': 'Test User',
            'email': email,
            'password': hashed,
            'role': 'user'
        })
        return f"SUCCESS: Account didn't exist, so we CREATED a new Rider account for {email} with password: password123", 200


@auth_bp.route('/me', methods=['GET'])
@any_authenticated
def get_me():
    """Get the currently authenticated user's profile."""
    db = current_app.config['db']
    current = g.current_user

    if current['role'] == 'user':
        user = db.users.find_one({'_id': __import__('bson').str(current['id'])})
        return jsonify({'user': serialize_user(user)}), 200
    elif current['role'] == 'driver':
        driver = db.drivers.find_one({'_id': __import__('bson').str(current['id'])})
        return jsonify({'user': serialize_driver(driver)}), 200
    elif current['role'] == 'admin':
        admin = db.admins.find_one({'_id': __import__('bson').str(current['id'])})
        return jsonify({'user': serialize_admin(admin)}), 200

    return jsonify({'error': 'Unknown role'}), 400
