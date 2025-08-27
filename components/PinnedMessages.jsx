import React, { Fragment } from 'react';
import { assets } from '@/assets/assets';
import Image from 'next/image';
import Message from './Message';
import { useTheme } from '@/context/ThemeContext';

const PinnedMessages = ({ pinnedMessages, onUnpinMessage, isVisible, onToggleVisibility }) => {
  const { isDark } = useTheme();
  
  if (!isVisible && pinnedMessages.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isVisible && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[9] md:hidden"
          onClick={onToggleVisibility}
        />
      )}
      
      {/* Pinned panel - responsive width with custom CSS classes */}
      <div className={`fixed right-0 top-0 h-full w-full pinned-panel-layout ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} border-l z-10 transform transition-transform duration-300 shadow-2xl flex flex-col ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-3 sm:p-4 ${isDark ? 'border-gray-600' : 'border-gray-300'} border-b flex-shrink-0`}>
        <div className="flex items-center gap-2">
          <Image src={assets.pin_svgrepo_com} alt="Pinned" className="w-5 h-5 sm:w-6 sm:h-6" />
          <h3 className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium text-sm sm:text-base`}>Pinned Messages</h3>
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>({pinnedMessages.length})</span>
        </div>
        <button
          onClick={onToggleVisibility}
          className={`${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'} transition-colors rounded-lg`}
        >
          <Image src={assets.sidebar_close_icon} alt="Close" className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </div>

      {/* Pinned Messages List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent min-h-0">

        {pinnedMessages.length === 0 ? (
          <div className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-6 sm:mt-8`}>
            <Image src={assets.pin_svgrepo_com} alt="No pins" className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm sm:text-base">No pinned messages yet</p>
            <p className="text-xs mt-1">Click the pin icon on any message to save it here</p>
          </div>
        ) : (
          pinnedMessages.map((msg, index) => (
            <div key={`pinned-${index}`} className="relative group mb-6 sm:mb-8">
              {/* Message Header with Unpin button - always visible */}
              <div className="flex items-center justify-between mb-2 px-1">
                {/* Message metadata */}
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${
                    msg.role === 'user' ? 'bg-blue-400' : 'bg-green-400'
                  }`}></span>
                  {msg.role === 'user' ? 'You' : 'AI'}
                </div>
                
                {/* Unpin button - always visible with beautiful design */}
                <button
                  onClick={() => onUnpinMessage(index)}
                  className={`unpin-button relative flex items-center gap-1 px-2 py-1 text-xs ${isDark ? 'text-gray-400 hover:text-red-400 border-gray-600 hover:border-red-400/50' : 'text-gray-600 hover:text-red-500 border-gray-400 hover:border-red-500/50'} rounded-md border transition-all shadow-sm`}
                  title="Unpin message"
                >
                  <svg 
                    className="w-3 h-3" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 21 3-6 3 6" />
                    <path d="M15 3a3 3 0 0 0-6 0l-.84 4.2a3 3 0 0 0 2.34 3.56L12 17l1.5-6.24a3 3 0 0 0 2.34-3.56L15 3Z" />
                  </svg>
                  <span className="hidden sm:inline font-medium">Unpin</span>
                </button>
              </div>
              
              {/* Full Message component - no borders */}
              <div className="pinned-message-container">
                <div className="max-w-full">
                  <Message 
                    role={msg.role} 
                    content={msg.content} 
                    images={msg.images}
                    showPinButton={false}
                    isInPinnedPanel={true}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    </>
  );
};

export default PinnedMessages;
