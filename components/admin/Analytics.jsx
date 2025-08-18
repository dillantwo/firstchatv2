"use client";
import React, { useState } from 'react';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [data, setData] = useState({
    overview: {
      activeUsers: 0,
      totalChats: 0,
      totalMessages: 0,
      estimatedCost: 0
    },
    dailyUsage: [],
    courseStats: []
  });
  const [loading, setLoading] = useState(true);

  const formatCurrency = (amount) => {
    return `$${Number(amount || 0).toFixed(4)}`;
  };

  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString();
  };

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last 1 year' }
  ];

  const StatCard = ({ title, value, subtitle, icon }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
        </div>
        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usage Analytics</h1>
            <div className="text-gray-600 mt-1">System usage and statistical analysis</div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <button className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700">
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Users"
          value={formatNumber(data.overview.activeUsers)}
          subtitle={timeRange === '7d' ? 'Last 7 days' : 'Last 30 days'}
          icon="👥"
        />
        
        <StatCard
          title="Total Conversations"
          value={formatNumber(data.overview.totalChats)}
          icon="💬"
        />
        
        <StatCard
          title="Total Messages"
          value={formatNumber(data.overview.totalMessages)}
          icon="📨"
        />
        
        <StatCard
          title="Estimated Cost"
          value={formatCurrency(data.overview.estimatedCost)}
          subtitle="Based on token usage"
          icon="💰"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Usage Trend */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Daily Usage Trends</h3>
          {data.dailyUsage.length > 0 ? (
            <div className="space-y-3">
              {data.dailyUsage.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">{day.date}</span>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>👥 {day.userCount}</span>
                    <span>💬 {day.chatCount}</span>
                    <span>📨 {day.messageCount}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <p>No usage data available</p>
              <p className="text-sm mt-2">Trend data will be displayed once the system starts being used</p>
            </div>
          )}
        </div>

        {/* Course Statistics */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Course Usage Statistics</h3>
          {data.courseStats.length > 0 ? (
            <div className="space-y-3">
              {data.courseStats.map((course, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{course.course}</div>
                    <div className="text-sm text-gray-600">👥 {course.userCount} users</div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div>💬 {course.chatCount}</div>
                    <div>📨 {course.messageCount}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📚</div>
              <p>No course data available</p>
              <p className="text-sm mt-2">Statistics will be displayed when courses start using the chatbot</p>
            </div>
          )}
        </div>
      </div>

      {/* Usage Pattern */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Usage Pattern Analysis</h3>
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">📈</div>
          <p>No usage pattern data available</p>
          <p className="text-sm mt-2">Pattern analysis will be displayed when sufficient usage data is accumulated</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
