import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-300 rounded-full animate-ping"></div>
        </div>
        <p className="text-gray-600 text-lg font-medium">加载管理面板中...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
