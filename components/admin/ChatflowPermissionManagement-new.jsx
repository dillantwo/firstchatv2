"use client";
import React, { useState, useEffect } from 'react';

const ChatflowPermissionManagement = () => {
  const [permissions, setPermissions] = useState([]);
  const [chatflows, setChatflows] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBatchUploadModal, setShowBatchUploadModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [filters, setFilters] = useState({
    courseId: '',
    chatflowId: '',
    status: '' // all, active, inactive
  });

  // 统计数据
  const [stats, setStats] = useState({
    totalPermissions: 0,
    totalChatflows: 0,
    activeChatflows: 0,
    inactiveChatflows: 0,
    totalCourses: 0
  });

  // 预定义的角色选项
  const roleOptions = [
    { value: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor', label: 'Instructor' },
    { value: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner', label: 'Learner' },
    { value: 'http://purl.imsglobal.org/vocab/lis/v2/membership#TeachingAssistant', label: 'Teaching Assistant' },
    { value: 'http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper', label: 'Content Developer' },
    { value: 'http://purl.imsglobal.org/vocab/lis/v2/membership#Administrator', label: 'Administrator' }
  ];

  // 获取权限列表和统计数据
  const fetchPermissions = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.courseId) queryParams.append('courseId', filters.courseId);
      if (filters.chatflowId) queryParams.append('chatflowId', filters.chatflowId);

      const response = await fetch(`/api/admin/chatflow-permissions?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        let filteredData = data.data;
        
        // 根据 chatflow 状态过滤
        if (filters.status === 'active') {
          filteredData = filteredData.filter(p => p.chatflow?.isActive === true);
        } else if (filters.status === 'inactive') {
          filteredData = filteredData.filter(p => p.chatflow?.isActive === false);
        }
        
        setPermissions(filteredData);
        
        // 更新统计数据
        setStats({
          totalPermissions: filteredData.length,
          totalChatflows: chatflows.length,
          activeChatflows: chatflows.filter(cf => cf.isActive).length,
          inactiveChatflows: chatflows.filter(cf => !cf.isActive).length,
          totalCourses: courses.length
        });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to fetch permissions');
      console.error('Error fetching permissions:', err);
    }
  };

  // 获取Chatflows列表
  const fetchChatflows = async () => {
    try {
      const response = await fetch('/api/admin/chatflow-permissions?action=chatflows');
      const data = await response.json();
      
      if (data.success) {
        setChatflows(data.data);
      }
    } catch (err) {
      console.error('Error fetching chatflows:', err);
    }
  };

  // 获取课程列表
  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/chatflow-permissions?action=courses');
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPermissions(),
        fetchChatflows(),
        fetchCourses()
      ]);
      setLoading(false);
    };

    loadData();
  }, [filters]);

  // 创建权限
  const handleCreate = async (formData) => {
    try {
      const response = await fetch('/api/admin/chatflow-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchPermissions();
        setShowCreateModal(false);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create permission');
      console.error('Error creating permission:', err);
    }
  };

  // 更新权限
  const handleUpdate = async (formData) => {
    try {
      const response = await fetch('/api/admin/chatflow-permissions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchPermissions();
        setShowEditModal(false);
        setEditingPermission(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to update permission');
      console.error('Error updating permission:', err);
    }
  };

  // 删除权限
  const handleDelete = async (permissionId) => {
    if (!window.confirm('Are you sure you want to delete this permission?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/chatflow-permissions?id=${permissionId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchPermissions();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to delete permission');
      console.error('Error deleting permission:', err);
    }
  };

  // 格式化角色显示
  const formatRoles = (roles) => {
    return roles.map(role => {
      const roleOption = roleOptions.find(option => option.value === role);
      return roleOption ? roleOption.label : role.split('#').pop();
    }).join(', ');
  };

  // 下载 CSV 模板
  const downloadTemplate = () => {
    const headers = ['chatflow_id', 'course_id', 'allowed_roles', 'is_active'];
    const sampleData = [
      ['chatflow_123', 'course_abc', 'Instructor;Learner', 'true'],
      ['chatflow_456', 'course_def', 'Instructor', 'true']
    ];
    
    const csvContent = [headers, ...sampleData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'chatflow_permissions_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 处理 CSV 文件上传
  const handleFileUpload = async () => {
    if (!uploadFile) return;

    setUploadProgress('uploading');
    
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const response = await fetch('/api/admin/chatflow-permissions/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUploadProgress('success');
        await fetchPermissions();
        setShowBatchUploadModal(false);
        setUploadFile(null);
        setUploadProgress(null);
      } else {
        setUploadProgress('error');
        setError(data.error);
      }
    } catch (err) {
      setUploadProgress('error');
      setError('Failed to upload file');
      console.error('Error uploading file:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chatflow Permission Management</h1>
          <p className="text-gray-600 mt-1">Manage chatflow access permissions for courses and roles</p>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Permissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPermissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Chatflows</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeChatflows}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Inactive Chatflows</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inactiveChatflows}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Chatflows</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalChatflows}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Permission</span>
        </button>
        
        <button
          onClick={() => setShowBatchUploadModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span>Batch Upload</span>
        </button>
        
        <button
          onClick={downloadTemplate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Download Template</span>
        </button>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters & Search</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Course
            </label>
            <select
              value={filters.courseId}
              onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Chatflow
            </label>
            <select
              value={filters.chatflowId}
              onChange={(e) => setFilters({ ...filters, chatflowId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="">All Chatflows</option>
              {chatflows.map((chatflow) => (
                <option key={chatflow.id} value={chatflow.id}>
                  {chatflow.name} {chatflow.isActive ? '(Active)' : '(Inactive)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="active">Active Chatflows Only</option>
              <option value="inactive">Inactive Chatflows Only</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ courseId: '', chatflowId: '', status: '' })}
              className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Permission Records</h3>
          <p className="text-sm text-gray-600 mt-1">
            Each record represents access permissions for a specific chatflow in a specific course
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chatflow
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Allowed Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chatflow Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permissions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">No permissions found</p>
                      <p className="text-sm text-gray-400 mt-1">Click "Add Permission" to create your first permission record</p>
                    </div>
                  </td>
                </tr>
              ) : (
                permissions.map((permission) => (
                  <tr key={permission._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {permission.chatflow?.name || 'Unknown Chatflow'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {permission.chatflow?.category || 'No Category'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {permission.course?.course || 'Unknown Course'}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {permission.courseId}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatRoles(permission.allowedRoles)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {permission.allowedRoles.length} role(s)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        permission.chatflow?.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${
                          permission.chatflow?.isActive ? 'bg-green-400' : 'bg-red-400'
                        }`}></span>
                        {permission.chatflow?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => {
                            setEditingPermission(permission);
                            setShowEditModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(permission._id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChatflowPermissionManagement;
