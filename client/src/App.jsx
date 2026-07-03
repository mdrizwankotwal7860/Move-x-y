import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';

// Common pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// User pages
import UserDashboard from './pages/user/UserDashboard';
import BookRide from './pages/user/BookRide';
import RideHistory from './pages/user/RideHistory';
import Profile from './pages/user/Profile';

// Driver pages
import DriverDashboard from './pages/driver/DriverDashboard';
import DriverRegister from './pages/driver/DriverRegister';
import DriverDocuments from './pages/driver/DriverDocuments';
import RideRequests from './pages/driver/RideRequests';
import DriverHistory from './pages/driver/DriverHistory';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageDrivers from './pages/admin/ManageDrivers';
import DriverDocReview from './pages/admin/DriverDocReview';
import ManageRides from './pages/admin/ManageRides';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-900">
            <Navbar />
            
            <main className="flex-1 w-full max-w-7xl mx-auto py-6">
              <ErrorBoundary>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />

                  {/* User Coordinated pages */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={['user', 'rider']}>
                      <UserDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/book" element={
                    <ProtectedRoute allowedRoles={['user', 'rider']}>
                      <BookRide />
                    </ProtectedRoute>
                  } />
                  <Route path="/history" element={
                    <ProtectedRoute allowedRoles={['user', 'rider']}>
                      <RideHistory />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute allowedRoles={['user', 'rider', 'driver']}>
                      <Profile />
                    </ProtectedRoute>
                  } />

                  {/* Driver Coordinated pages */}
                  <Route path="/driver" element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <DriverDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/driver/register" element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <DriverRegister />
                    </ProtectedRoute>
                  } />
                  <Route path="/driver/documents" element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <DriverDocuments />
                    </ProtectedRoute>
                  } />
                  <Route path="/driver/requests" element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <RideRequests />
                    </ProtectedRoute>
                  } />
                  <Route path="/driver/history" element={
                    <ProtectedRoute allowedRoles={['driver']}>
                      <DriverHistory />
                    </ProtectedRoute>
                  } />

                  {/* Admin system dashboards */}
                  <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/users" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ManageUsers />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/drivers" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ManageDrivers />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/drivers/:id/documents" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <DriverDocReview />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/rides" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ManageRides />
                    </ProtectedRoute>
                  } />

                  {/* Fallback to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </main>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}
