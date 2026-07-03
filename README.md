# Move X-Y — Premium Coordinated Real-Time Ride Booking Terminal

A modern full-stack ride-booking web application featuring a **Python (Flask) backend** and an **interactive React.js + Tailwind CSS frontend**. Built as a high-fidelity academic presentation project (MCA/BCA/B.Tech), this repository handles real-time coordinates coordination via **Socket.IO** and map interactions using **OpenStreetMap (Leaflet)**.

---

## 🚗 Key Modules & Features

### 1. User (Rider) Module
- **Interactive Maps Picker**: Click on any coordinate to set pickup and dropped targets instantly with auto-nominatim geocoding.
- **Estimated Fare**: Pre-calculated fare based on distance (Haversine formula).
- **Live Ride Tracking**: Track state flow (`requested` → `accepted` → `started` → `completed`) with real-time driver coordinates on screen.
- **Trip History**: Completed trip listings with driver references.
- **Star Rating system**: Submit 1-5 reviews for drivers on completed trips.

### 2. Driver Module
- **Vehicle Registration**: Add brand, color, model, year, plate number, and type.
- **Status Toggle**: Set yourself Online/Offline.
- **Ride Offer Sheets**: Real-time Socket.IO popup modals to Accept/Reject incoming offers.
- **Coordinated Flow Controls**: "Start Ride" and "Arrived / Complete Trip" triggers.
- **Simulated GPS**: Simulated location increments synced with passenger maps in real-time.

### 3. Admin Module
- **Stats Dashboard**: 6 platform performance metrics (Total Passengers, Drivers, Bookings, Active coordinates, Completed drops, Pending validations).
- **Passenger Registry**: View passenger database details.
- **Driver Approvals**: Validate and approve/reject vehicle driver credentials.
- **Ledger Records**: System-wide ledger logs.

---

## 📂 Project Directory Structure

```
e:\uber_clone\
├── server/                         # Python Flask Backend
│   ├── app.py                      # Main Flask application factory
│   ├── config.py                   # Environment settings & fare specifications
│   ├── seed.py                     # Realistic Indian Locale database seeder
│   ├── requirements.txt            # Python dependencies
│   ├── models/                     # CRUD data schemas
│   ├── routes/                     # Blueprint API endpoints
│   ├── sockets/                    # Socket.IO coordinate channels
│   └── utils/                      # Distance and pricing helpers
│
└── client/                         # React Frontend (Vite)
    ├── index.html                  # Root template (Inter Font integration)
    ├── src/
    │   ├── main.jsx                # React Entry point
    │   ├── App.jsx                 # Context wrappers & Route protection
    │   ├── index.css               # Glassmorphism utilities & map overrides
    │   ├── api/                    # Axios interceptors (JWT injection)
    │   ├── context/                # Auth & Socket coordinate streams
    │   ├── components/             # Reusable UI controls (Leaflet Map picker, Stats card, Navbar)
    │   └── pages/                  # Landing, Auth, User, Driver, Admin views
```

---

## ⚙️ Installation & Setup Guide

### Prerequisites
1. **Node.js** (v18+)
2. **Python** (v3.8+)
3. **MongoDB** (Running locally on `mongodb://localhost:27017`)

---

### Step 1: Backend Server Setup

1. Open your terminal in the `server` directory:
   ```bash
   cd server
   ```

2. Create a virtual environment (Recommended):
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Populate the database with realistic sample data:
   ```bash
   python seed.py
   ```
   *This seeds a default Admin, 3 Users, 3 Drivers, 3 Vehicles, 5 Rides, and 3 Reviews.*

5. Launch the Flask API server:
   ```bash
   python app.py
   ```
   *The server starts on http://localhost:5000 with live Socket.IO capabilities.*

---

### Step 2: Frontend Setup

1. Open a new terminal in the `client` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   *The client terminal starts on http://localhost:5173.*

---

## 🔑 Default Seed Credentials for Presentation

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@uberclone.com` | `admin123` | Control panel dashboard access |
| **Rider (User)** | `rahul@test.com` | `user123` | Ready to book new rides |
| **Driver (Online)** | `suresh@test.com` | `driver123` | **Approved**, Swift vehicle registered, Online status active |
| **Driver (Offline)** | `vikram@test.com` | `driver123` | **Approved**, Creta vehicle, Offline state |
| **Driver (Pending)** | `ravi@test.com` | `driver123` | **Awaiting Admin Approval** (Awaiting validation) |

---

## 💎 Design and Technology Exclusions
As per academic criteria:
- **No payment gateway integration** (pricing estimates provided off-platform).
- **No wallets or coupons** (simplified booking flow).
- **Leaflet OpenStreetMap** integration (completely free, **no paid Google Maps API keys required**).
