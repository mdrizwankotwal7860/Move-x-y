import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'uber-clone-secret-key-2024')
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/uber_clone')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-super-secret-key-2024')
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours in seconds
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')
    
    # Fare configuration
    BASE_FARE = float(os.getenv('BASE_FARE', '50'))         # Base fare in currency
    RATE_PER_KM = float(os.getenv('RATE_PER_KM', '15'))     # Rate per kilometer
    MIN_FARE = float(os.getenv('MIN_FARE', '80'))            # Minimum fare
