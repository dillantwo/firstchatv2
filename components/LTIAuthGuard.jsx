"use client";
import { useLTIAuth } from "@/context/LTIAuthContext";

export default function LTIAuthGuard({ children }) {
  const { isLoading, isAuthenticated } = useLTIAuth();

  console.log('[LTI AuthGuard] isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  if (isLoading) {
    console.log('[LTI AuthGuard] Showing loading state');
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
    console.log('[LTI AuthGuard] User not authenticated, showing access denied');
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#292a2d] text-white">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
          <p className="text-gray-300 mb-6">
            This application can only be accessed through Moodle LTI 1.3. 
            Please access this tool from within your Moodle course.
          </p>
          
          <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4 text-yellow-200">
            <h3 className="font-semibold mb-2">For Instructors:</h3>
            <p className="text-sm">
              Add this tool to your Moodle course as an External Tool (LTI) activity to allow students to access the chatbot.
            </p>
          </div>
        </div>
      </div>
    );
  }

  console.log('[LTI AuthGuard] User authenticated, rendering children');
  return children;
}
