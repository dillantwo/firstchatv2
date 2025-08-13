"use client";
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

export const LTIAuthContext = createContext();

export const useLTIAuth = () => {
  const context = useContext(LTIAuthContext);
  if (!context) {
    throw new Error('useLTIAuth must be used within an LTIAuthProvider');
  }
  return context;
};

export const LTIAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      console.log('[LTI Auth] Checking authentication...');
      const response = await axios.get('/api/lti/session');
      console.log('[LTI Auth] Session response:', response.data);
      
      if (response.data.authenticated) {
        console.log('[LTI Auth] User authenticated:', response.data.user.name);
        setUser(response.data.user);
        setIsAuthenticated(true);
        console.log('[LTI Auth] Authentication state set to true');
        console.log('[LTI Auth] User object set:', response.data.user);
      } else {
        console.log('[LTI Auth] User not authenticated');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[LTI Auth] Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      console.log('[LTI Auth] Loading state set to false');
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post('/api/lti/session');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Get authorization header for API calls
  const getAuthHeader = () => {
    // For LTI, we use cookies for authentication, so no header needed
    return {};
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    checkAuth,
    logout,
    getAuthHeader
  };

  return (
    <LTIAuthContext.Provider value={value}>
      {children}
    </LTIAuthContext.Provider>
  );
};
