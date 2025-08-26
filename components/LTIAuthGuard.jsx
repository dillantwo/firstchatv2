"use client";
import { useLTIAuth } from "@/context/LTIAuthContext";

export default function LTIAuthGuard({ children }) {
  const { isLoading, isAuthenticated } = useLTIAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#292a2d] text-white">
        <div className="text-center">
          <div className="loader flex justify-center items-center gap-1 mb-4">
            <div className="w-2 h-2 rounded-full bg-white animate-bounce"></div>
            <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    
    const handleGoToMoodle = () => {
      // 跳转到Moodle网站
      window.open(process.env.NEXT_PUBLIC_MOODLE_LINK || 'https://qefmoodle.com', '_blank');
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md mx-4 p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Moodle Login Required</h2>
            <p className="text-gray-600">
              You have been logged out from Moodle. Please log in again through Moodle to continue using the chatbot.
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">How to access:</h3>
                <p className="text-sm text-blue-700">
                  This chatbot can only be accessed through your Moodle course. Please find the chatbot activity in your course and click on it.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={handleGoToMoodle}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Go to Moodle
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
