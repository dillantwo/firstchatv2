"use client";
import React, { useState, useEffect } from 'react';

// Dynamic import components to avoid initial loading issues
const AdminSidebar = React.lazy(() => import('./admin/AdminSidebar'));
const DashboardOverview = React.lazy(() => import('./admin/DashboardOverview'));
const UserManagement = React.lazy(() => import('./admin/UserManagement'));
const ChatflowPermissionManagement = React.lazy(() => import('./admin/ChatflowPermissionManagement'));
const Analytics = React.lazy(() => import('./admin/Analytics'));

const AdminDashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setLoading(false);
  }, []);

  // Available tabs
  const availableTabs = [
    { id: 'dashboard', name: 'Dashboard', icon: '📊' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'chatflow-permissions', name: 'Chatflow Permissions', icon: '🔐' },
    { id: 'analytics', name: 'Analytics', icon: '📈' }
  ];

  if (loading || !isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-300 rounded-full animate-ping"></div>
          </div>
          <div className="text-gray-600 text-lg font-medium">Loading admin panel...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 14.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Loading Failed</h3>
          </div>
          <div className="text-gray-600 mb-6">{error}</div>
          <button
            onClick={() => setError(null)}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'dashboard':
          return (
            <React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
              <DashboardOverview />
            </React.Suspense>
          );
        case 'users':
          return (
            <React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
              <UserManagement />
            </React.Suspense>
          );
        case 'chatflow-permissions':
          return (
            <React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
              <ChatflowPermissionManagement />
            </React.Suspense>
          );
        case 'analytics':
          return (
            <React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
              <Analytics />
            </React.Suspense>
          );
        default:
          return (
            <React.Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
              <DashboardOverview />
            </React.Suspense>
          );
      }
    } catch (err) {
      setError(err.message);
      return <div className="p-8 text-center text-red-600">Error loading component</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <React.Suspense fallback={<div className="fixed left-0 top-0 w-64 bg-white h-screen">Loading...</div>}>
        <AdminSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          availableTabs={availableTabs}
          user={user}
        />
      </React.Suspense>
      <main className="ml-64">
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
