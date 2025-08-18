"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLTIAuth } from '../../context/LTIAuthContext';
import AdminDashboard from '../../components/AdminDashboard';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated, isLoading } = useLTIAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for LTI auth to finish loading
    if (!isLoading) {
      setLoading(false);
    }
  }, [isLoading]);

  if (loading) {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 14.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Access Required</h3>
          </div>
          <div className="text-gray-600 mb-6">
            You need to be logged in through LTI to access the admin dashboard.
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            Return to Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminDashboard user={user} />
    </div>
  );
}
