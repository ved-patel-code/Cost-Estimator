import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Load User on App Start
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Verify token is valid by calling /me endpoint
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error("Session invalid:", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  // 2. Login Function
  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', {
        username: username, // Our backend expects form data keys usually, but JSON works if router configured
        password: password
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' } // OAuth2 standard
      });

      const { access_token } = response.data;
      
      // Save Token
      localStorage.setItem('token', access_token);
      
      // Fetch User Details immediately
      const userResponse = await api.get('/auth/me');
      setUser(userResponse.data);
      
      return true;
    } catch (error) {
      const msg = error.response?.data?.detail || "Login failed";
      toast.error(msg);
      return false;
    }
  };

  // 3. Register Function
  const register = async (username, email, password) => {
    try {
      await api.post('/auth/signup', {
        username,
        email,
        password
      });
      // Auto-login after signup
      await login(username, password);
      return true;
    } catch (error) {
      const msg = error.response?.data?.detail || "Registration failed";
      toast.error(msg);
      return false;
    }
  };

  // 4. Logout Function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.info("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom Hook for easier usage
export const useAuth = () => useContext(AuthContext);