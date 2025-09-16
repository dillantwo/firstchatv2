"use client";
import React, { useState, useEffect } from 'react';

const DashboardOverview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalChats: 0,
    totalMessages: 0,
    estimatedCost: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初始化数据，暂时保持为0
    const loadData = () => {
      setTimeout(() => {
        setStats({
          totalUsers: 0,
          activeUsers: 0,
          totalChats: 0,
          totalMessages: 0,
          estimatedCost: 0
        });
        setLoading(false);
      }, 500);
    };
    
    loadData();
  }, []);

  const formatCurrency = (amount) => {
    return `$${Number(amount || 0).toFixed(4)}`;
  };

  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString();
  };

  const statCards = [
    {
      title: 'Total Users',
      value: formatNumber(stats.totalUsers),
      icon: '👥',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Active Users (7 days)',
      value: formatNumber(stats.activeUsers),
      icon: '⚡',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Total Conversations',
      value: formatNumber(stats.totalChats),
      icon: '💬',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Total Messages',
      value: formatNumber(stats.totalMessages),
      icon: '📨',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Estimated Cost (7 days)',
      value: formatCurrency(stats.estimatedCost),
      icon: '💰',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
            <p className="text-gray-600 mt-1">QEF Chatbot System Status</p>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200">
            <span>🔄</span>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    card.value
                  )}
                </div>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                <span className="text-2xl">{card.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span>👥</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Manage Users</p>
                <p className="text-sm text-gray-600">View and manage user accounts</p>
              </div>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span>🔐</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Permission Configuration</p>
                <p className="text-sm text-gray-600">Set course and chatflow permissions</p>
              </div>
            </button>
            <button className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span>📊</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">View Analytics</p>
                <p className="text-sm text-gray-600">View usage statistics and data</p>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">API Status</span>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Normal
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database Connection</span>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">LTI Integration</span>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Active
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Updated</span>
              <span className="text-gray-600">{new Date().toLocaleString('zh-HK', {
                timeZone: 'Asia/Hong_Kong',
                hour12: false
              })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
