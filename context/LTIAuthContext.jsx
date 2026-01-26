"use client";
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

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
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Handle 401 errors (token expired)
  const handleTokenExpired = () => {
    setUser(null);
    setIsAuthenticated(false);
    setShowLogoutModal(true);
  };

  // Redirect to Moodle courses page
  const redirectToMoodle = () => {
    window.location.href = 'https://www.qefmoodle.com/my/courses.php';
  };

  // Check authentication status
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/lti/session');
      
      if (response.data.authenticated) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        handleTokenExpired();
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post('/api/lti/session');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      // Handle logout error silently
    }
  };

  // Get authorization header for API calls
  const getAuthHeader = () => {
    // For LTI, we use cookies for authentication, so no header needed
    return {};
  };

  useEffect(() => {
    checkAuth();
    
    // Add global axios interceptor to handle 401 errors
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          handleTokenExpired();
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated,
    checkAuth,
    logout,
    getAuthHeader,
    showLogoutModal,
    setShowLogoutModal,
    redirectToMoodle
  };

  return (
    <LTIAuthContext.Provider value={value}>
      {children}
      
      {/* Token过期提示弹窗 */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Session Expired</h3>
            <p className="text-sm text-gray-600 mb-6">
              Moodle platform has logged out. Please login again.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={redirectToMoodle}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Moodle
              </button>
            </div>
          </div>
        </div>
      )}
    </LTIAuthContext.Provider>
  );
};
