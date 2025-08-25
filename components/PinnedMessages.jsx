import React, { Fragment } from 'react';
import { assets } from '@/assets/assets';
import Image from 'next/image';
import Message from './Message';

const PinnedMessages = ({ pinnedMessages, onUnpinMessage, isVisible, onToggleVisibility }) => {
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
      
      {/* Pinned panel */}
      <div className={`fixed right-0 top-0 h-full w-full sm:w-[450px] md:w-[500px] lg:w-[600px] xl:w-[700px] bg-gray-800 border-l border-gray-600 z-10 transform transition-transform duration-300 shadow-2xl flex flex-col ${
        isVisible ? 'translate-x-0' : 'translate-x-full'
      }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-600 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Image src={assets.pin_icon} alt="Pinned" className="w-5 h-5 sm:w-6 sm:h-6" />
          <h3 className="text-white font-medium text-sm sm:text-base">Pinned Messages</h3>
          <span className="text-xs text-gray-400">({pinnedMessages.length})</span>
        </div>
        <button
          onClick={onToggleVisibility}
          className="text-gray-400 hover:text-white transition-colors hover:bg-gray-700 rounded-lg"
        >
          <Image src={assets.sidebar_close_icon} alt="Close" className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </div>

      {/* Pinned Messages List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent min-h-0">
        {pinnedMessages.length === 0 ? (
          <div className="text-center text-gray-400 mt-6 sm:mt-8">
            <Image src={assets.pin_icon} alt="No pins" className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm sm:text-base">No pinned messages yet</p>
            <p className="text-xs mt-1">Click the pin icon on any message to save it here</p>
          </div>
        ) : (
          pinnedMessages.map((msg, index) => (
            <div key={`pinned-${index}`} className="relative group mb-6 sm:mb-8">
              {/* Unpin button - simplified */}
              <button
                onClick={() => onUnpinMessage(index)}
                className="absolute top-1 right-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-sm sm:text-lg font-bold shadow-lg"
                title="Unpin message"
              >
                ×
              </button>
              
              {/* Message metadata - simplified */}
              <div className="text-xs text-gray-400 mb-1 px-1">
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${
                  msg.role === 'user' ? 'bg-blue-400' : 'bg-green-400'
                }`}></span>
                {msg.role === 'user' ? 'You' : 'AI'}
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
