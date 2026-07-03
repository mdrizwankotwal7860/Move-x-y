import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if token exists on load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (err) {
        console.error('Auth verification failed:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user: loggedUser } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return loggedUser;
    } catch (err) {
      // Handle driver pending approval (403) or other errors
      if (err.response?.status === 403) {
        throw err.response?.data?.error || 'Account pending admin approval.';
      }
      throw err.response?.data?.error || 'Login failed';
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (name, email, password, phone) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register/user', { name, email, password, phone });
      const { token, user: registeredUser } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(registeredUser));
      setUser(registeredUser);
      return registeredUser;
    } catch (err) {
      throw err.response?.data?.error || 'Registration failed';
    } finally {
      setLoading(false);
    }
  };

  const registerDriver = async (name, email, password, phone) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register/driver', { name, email, password, phone });
      const { token, user: registeredDriver } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(registeredDriver));
      setUser(registeredDriver);
      return registeredDriver;
    } catch (err) {
      throw err.response?.data?.error || 'Registration failed';
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, registerUser, registerDriver, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
