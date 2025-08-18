"use client";
import React, { useState, useEffect } from 'react';

export default function AdminDebugPage() {
  const [debugInfo, setDebugInfo] = useState({
    hasToken: false,
    token: '',
    tokenValid: null,
    userInfo: null,
    adminCheck: null,
    error: null
  });

  useEffect(() => {
    checkTokenStatus();
  }, []);

  const checkTokenStatus = () => {
    const token = localStorage.getItem('token');
    
    setDebugInfo(prev => ({
      ...prev,
      hasToken: !!token,
      token: token ? `${token.substring(0, 50)}...` : 'No token found'
    }));

    if (token) {
      // Try to decode token (client-side, just for structure check)
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          setDebugInfo(prev => ({
            ...prev,
            tokenValid: true,
            userInfo: payload
          }));
        } else {
          setDebugInfo(prev => ({
            ...prev,
            tokenValid: false,
            error: 'Invalid token format'
          }));
        }
      } catch (error) {
        setDebugInfo(prev => ({
          ...prev,
          tokenValid: false,
          error: 'Token decode error: ' + error.message
        }));
      }
    }
  };

  const testAdminAccess = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setDebugInfo(prev => ({
        ...prev,
        adminCheck: { success: false, error: 'No token in localStorage' }
      }));
      return;
    }

    try {
      const response = await fetch('/api/admin/check-access', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      setDebugInfo(prev => ({
        ...prev,
        adminCheck: {
          success: response.ok,
          status: response.status,
          data: data
        }
      }));
    } catch (error) {
      setDebugInfo(prev => ({
        ...prev,
        adminCheck: {
          success: false,
          error: error.message
        }
      }));
    }
  };

  const clearToken = () => {
    localStorage.removeItem('token');
    setDebugInfo({
      hasToken: false,
      token: '',
      tokenValid: null,
      userInfo: null,
      adminCheck: null,
      error: null
    });
  };

  const setTestToken = () => {
    // This would be a sample token for testing
    const testPayload = {
      sub: "test-user-id",
      iss: "test-issuer",
      aud: "test-audience",
      name: "Test User",
      email: "test@example.com",
      context_id: "test-course",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
    
    const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJpc3MiOiJ0ZXN0LWlzc3VlciIsImF1ZCI6InRlc3QtYXVkaWVuY2UiLCJuYW1lIjoiVGVzdCBVc2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiY29udGV4dF9pZCI6InRlc3QtY291cnNlIiwiaWF0IjoxNzI5MjQwMDAwLCJleHAiOjE3MjkyNDM2MDB9.test-signature";
    
    localStorage.setItem('token', testToken);
    checkTokenStatus();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Access Debug Tool</h1>
          
          {/* Token Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Token Status</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="font-medium">Has Token:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  debugInfo.hasToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {debugInfo.hasToken ? 'Yes' : 'No'}
                </span>
              </div>
              
              {debugInfo.hasToken && (
                <div>
                  <span className="font-medium">Token:</span>
                  <div className="mt-1 p-2 bg-gray-100 rounded text-sm font-mono break-all">
                    {debugInfo.token}
                  </div>
                </div>
              )}
              
              {debugInfo.tokenValid !== null && (
                <div className="flex items-center">
                  <span className="font-medium">Token Valid:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    debugInfo.tokenValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {debugInfo.tokenValid ? 'Valid Format' : 'Invalid Format'}
                  </span>
                </div>
              )}
              
              {debugInfo.error && (
                <div className="text-red-600 text-sm">
                  Error: {debugInfo.error}
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          {debugInfo.userInfo && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h2 className="text-lg font-semibold mb-3">Token Payload</h2>
              <pre className="text-sm bg-blue-100 p-3 rounded overflow-auto">
                {JSON.stringify(debugInfo.userInfo, null, 2)}
              </pre>
            </div>
          )}

          {/* Admin Check Result */}
          {debugInfo.adminCheck && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <h2 className="text-lg font-semibold mb-3">Admin Access Check Result</h2>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="font-medium">Success:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    debugInfo.adminCheck.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {debugInfo.adminCheck.success ? 'Yes' : 'No'}
                  </span>
                </div>
                
                {debugInfo.adminCheck.status && (
                  <div>
                    <span className="font-medium">HTTP Status:</span>
                    <span className="ml-2">{debugInfo.adminCheck.status}</span>
                  </div>
                )}
                
                <div>
                  <span className="font-medium">Response:</span>
                  <pre className="mt-1 text-sm bg-purple-100 p-3 rounded overflow-auto">
                    {JSON.stringify(debugInfo.adminCheck.data || debugInfo.adminCheck.error, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={checkTokenStatus}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Token Status
            </button>
            
            <button
              onClick={testAdminAccess}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Test Admin Access
            </button>
            
            <button
              onClick={clearToken}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Token
            </button>
            
            <button
              onClick={setTestToken}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Set Test Token
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Go to Login
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Troubleshooting Steps:</h3>
            <ol className="list-decimal list-inside space-y-1 text-yellow-700">
              <li>If no token: Click "Go to Login" to perform LTI authentication</li>
              <li>If token exists but invalid: Clear token and login again</li>
              <li>If admin access fails: Check if user has admin permissions in database</li>
              <li>If still issues: Run the debug script in terminal</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
