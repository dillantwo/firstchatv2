"use client";
import React, { useState, useEffect } from 'react';

const ChatHistoryManager = ({ userPermissions }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedChat, setSelectedChat] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchChatHistory();
  }, [currentPage, searchQuery, selectedCourse, selectedUser, startDate, endDate]);

  useEffect(() => {
    fetchUsers();
  }, [selectedCourse]);

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCourse) params.append('courseId', selectedCourse);
      if (selectedUser) params.append('userId', selectedUser);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/admin/chat-history?${params}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setChats(data.data.chats);
        setPagination(data.data.pagination);
        setCourses(data.data.courses);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({ limit: '1000' });
      if (selectedCourse) params.append('courseId', selectedCourse);

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        // 去重用户（因为现在是用户-课程记录）
        const uniqueUsers = [];
        const userIds = new Set();
        
        data.data.users.forEach(user => {
          if (!userIds.has(user._id)) {
            userIds.add(user._id);
            uniqueUsers.push(user);
          }
        });
        
        setUsers(uniqueUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchChatDetail = async (chatId) => {
    try {
      const response = await fetch(`/api/admin/chat-history/${chatId}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setSelectedChat(data.data.chat);
        setShowChatModal(true);
      }
    } catch (error) {
      console.error('Error fetching chat detail:', error);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString('zh-HK', {
      timeZone: 'Asia/Hong_Kong',
      hour12: false
    });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('zh-HK', {
      timeZone: 'Asia/Hong_Kong',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCourse('');
    setSelectedUser('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleDownload = async (format) => {
    if (!selectedCourse) {
      alert('请先选择一个课程');
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        courseId: selectedCourse,
        format: format
      });
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/admin/chat-history/export?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // 从响应头获取文件名，支持中文
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename;
        
        if (contentDisposition) {
          // 从 filename*=UTF-8'' 获取文件名
          const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
          if (utf8Match) {
            filename = decodeURIComponent(utf8Match[1]);
          } else {
            filename = `chat_history_${format}_${new Date().toISOString().split('T')[0]}.${format}`;
          }
        } else {
          filename = `chat_history_${format}_${new Date().toISOString().split('T')[0]}.${format}`;
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // 成功提示
        alert(`${format.toUpperCase()} 文件下载成功！`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '下载失败');
      }
    } catch (error) {
      console.error('下载错误:', error);
      alert(`下载失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">💬</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Chats</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalChats || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-medium">📝</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Messages</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalMessages || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm font-medium">🪙</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tokens</p>
              <p className="text-2xl font-semibold text-gray-900">{(stats.totalTokens || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-medium">�</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Input Tokens</p>
              <p className="text-2xl font-semibold text-gray-900">{(stats.totalPromptTokens || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">📤</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Output Tokens</p>
              <p className="text-2xl font-semibold text-gray-900">{(stats.totalCompletionTokens || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Chats</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chat names or content..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.courseName || course._id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name || user.email || user.username || 'Unknown User'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={fetchChatHistory}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Filter
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Download Section */}
        {selectedCourse && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  Export Chat History for Selected Course
                </h4>
                <p className="text-xs text-gray-500">
                  Course: {courses.find(c => c._id === selectedCourse)?.courseName || selectedCourse}
                  {startDate && ` | From: ${startDate}`}
                  {endDate && ` | To: ${endDate}`}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownload('json')}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {loading ? 'Downloading...' : 'Download JSON'}
                </button>
                <button
                  onClick={() => handleDownload('csv')}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {loading ? 'Downloading...' : 'Download CSV'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat History Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chat Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`loading-${index}`}>
                    <td className="px-6 py-4">
                      <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : chats.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No chats found</h3>
                      <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                chats.map((chat) => (
                  <tr key={chat._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{chat.name}</div>
                        <div className="text-sm text-gray-500">Created: {formatDate(chat.createdAt)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {chat.user?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">{chat.user?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {chat.course?.context_title || chat.courseId || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {chat.messageCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(chat.lastMessageAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-600">
                        <div className="mb-1">
                          <span className="font-medium">Total:</span> {((chat.totalTokenUsage?.totalTokens) || chat.estimatedTokens || 0).toLocaleString()}
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">Input:</span> {(chat.totalTokenUsage?.promptTokens || 0).toLocaleString()}
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">Output:</span> {(chat.totalTokenUsage?.completionTokens || 0).toLocaleString()}
                        </div>
                        <div className="text-green-600 font-medium">
                          ${chat.estimatedCost.toFixed(4)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => fetchChatDetail(chat._id)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium transition-colors"
                      >
                        View Details
                      </button>
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
              Showing {(currentPage - 1) * pagination.limit + 1} - {Math.min(currentPage * pagination.limit, pagination.totalChats)} 
              of {pagination.totalChats} chats
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-md">
                {currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Detail Modal */}
      {showChatModal && selectedChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedChat.name}</h3>
                <p className="text-sm text-gray-600">
                  {selectedChat.user?.name} • {selectedChat.course?.context_title || 'Unknown Course'}
                </p>
              </div>
              <button 
                onClick={() => setShowChatModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                {selectedChat.messages?.map((message, index) => (
                  <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-3xl px-4 py-2 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="text-sm mb-1">
                        <span className="font-medium">
                          {message.role === 'user' ? 'User' : 'Assistant'}
                        </span>
                        <span className="ml-2 text-xs opacity-75">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.images && message.images.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.images.map((image, imgIndex) => (
                            <img 
                              key={imgIndex}
                              src={image.url} 
                              alt={image.name || 'Chat image'}
                              className="max-w-sm rounded"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Messages:</span>
                  <span className="ml-2">{selectedChat.messages?.length || 0}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Total Tokens:</span>
                  <span className="ml-2">{selectedChat.totalTokenUsage?.totalTokens?.toLocaleString() || 0}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Input Tokens:</span>
                  <span className="ml-2">{selectedChat.totalTokenUsage?.promptTokens?.toLocaleString() || 0}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Output Tokens:</span>
                  <span className="ml-2">{selectedChat.totalTokenUsage?.completionTokens?.toLocaleString() || 0}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Cost:</span>
                  <span className="ml-2">${((selectedChat.totalTokenUsage?.totalTokens || 0) * 0.000001).toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHistoryManager;
