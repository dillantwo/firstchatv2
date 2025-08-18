"use client";
import React, { useState, useEffect } from 'react';
import AdminPermissionManager from './AdminPermissionManager';

const UserManagement = ({ userPermissions }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [courses, setCourses] = useState([]);

  const hasPermission = (permission) => {
    return userPermissions?.permissions?.[permission] === true;
  };

  const tabs = [
    { 
      id: 'users', 
      name: 'LTI Users', 
      icon: '👥',
      permission: 'user_view'
    },
    { 
      id: 'admin-permissions', 
      name: 'Admin Permissions', 
      icon: '🔐',
      permission: 'permission_view'
    }
  ];

  const availableTabs = tabs.filter(tab => hasPermission(tab.permission));

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(tab => tab.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [userPermissions]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [currentPage, searchQuery, selectedCourse, activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCourse) params.append('courseId', selectedCourse);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
        setCourses(data.data.courses);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString('en-US');
  };

  if (availableTabs.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-700">
            You don't have permission to access user management features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <div className="text-gray-600 mt-1">Manage system users and admin permissions</div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'admin-permissions' ? (
        <AdminPermissionManager userPermissions={userPermissions} />
      ) : (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-64"
                />
              </div>
              
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.courseName || course._id} ({course.userCount} users)
                  </option>
                ))}
              </select>
              
              <button
                onClick={fetchUsers}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Info</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                            <div>
                              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
                              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></td>
                        <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></td>
                        <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div></td>
                        <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div></td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                          <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {(user.name || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name || 'Unknown User'}</div>
                              <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{user.context_title || user.context_id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isAdmin 
                              ? 'bg-red-100 text-red-800' 
                              : user.isInstructor 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.isAdmin ? 'Admin' : user.isInstructor ? 'Instructor' : 'Student'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{formatDate(user.last_login)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                              View
                            </button>
                            {hasPermission('user_edit') && (
                              <button className="text-green-600 hover:text-green-900 text-sm font-medium">
                                Edit
                              </button>
                            )}
                            {hasPermission('user_delete') && (
                              <button className="text-red-600 hover:text-red-900 text-sm font-medium">
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * pagination.limit + 1} - {Math.min(currentPage * pagination.limit, pagination.totalUsers)} 
                  of {pagination.totalUsers} users
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={currentPage >= pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
