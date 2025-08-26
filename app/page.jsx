'use client';
import { assets } from "@/assets/assets";
import Message from "@/components/Message";
import PromptBox from "@/components/PromptBox";
import Sidebar from "@/components/Sidebar";
import LTIAuthGuard from "@/components/LTIAuthGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import PinnedMessages from "@/components/PinnedMessages";
import ViewportHandler from "@/components/ViewportHandler";
import ThemeToggle from "@/components/ThemeToggle";
import { useAppContext } from "@/context/AppContextLTI";
import { useTheme } from "@/context/ThemeContext";
import { useHydration } from "@/utils/useHydration";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function Home() {

  const [expand, setExpand] = useState(false)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [pinnedMessages, setPinnedMessages] = useState([])
  const [showPinnedPanel, setShowPinnedPanel] = useState(false)
  const {selectedChat, selectedChatflow, handleChatflowChange, createNewChat} = useAppContext()
  const { isDark } = useTheme()
  const containerRef = useRef(null)
  const hasHydrated = useHydration();

  useEffect(()=>{
    if(selectedChat){
      setMessages(selectedChat.messages)
    } else {
      setMessages([]) // Clear messages when no chat is selected
    }
  },[selectedChat])

  useEffect(()=>{
    if(containerRef.current){
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  },[messages])

  // Handle pinning/unpinning messages
  const handlePinMessage = (message) => {
    // Create a unique ID for the message based on content and role
    const messageId = `${message.role}-${message.content?.slice(0, 100)?.replace(/\s/g, '')}`;
    const isAlreadyPinned = pinnedMessages.some(pinned => 
      `${pinned.role}-${pinned.content?.slice(0, 100)?.replace(/\s/g, '')}` === messageId
    );

    if (isAlreadyPinned) {
      // Unpin message
      setPinnedMessages(prev => prev.filter(pinned => 
        `${pinned.role}-${pinned.content?.slice(0, 100)?.replace(/\s/g, '')}` !== messageId
      ));
    } else {
      // Pin message
      setPinnedMessages(prev => [...prev, { ...message, timestamp: Date.now() }]);
      if (!showPinnedPanel) {
        setShowPinnedPanel(true);
      }
    }
  };

  // Handle unpinning from pinned panel
  const handleUnpinMessage = (index) => {
    setPinnedMessages(prev => prev.filter((_, i) => i !== index));
  };

  // Check if a message is pinned
  const isMessagePinned = (message) => {
    const messageId = `${message.role}-${message.content?.slice(0, 100)?.replace(/\s/g, '')}`;
    return pinnedMessages.some(pinned => 
      `${pinned.role}-${pinned.content?.slice(0, 100)?.replace(/\s/g, '')}` === messageId
    );
  };

  // Don't render until hydrated to prevent mismatches
  if (!hasHydrated) {
    return null;
  }



  return (
    <LTIAuthGuard>
      <ErrorBoundary>
        <ViewportHandler />
        <div className={`main-container ${isDark ? 'bg-[#292a2d]' : 'bg-white'} transition-colors duration-300`}>
          <div className={`flex h-screen ${isDark ? 'bg-[#292a2d]' : 'bg-white'} transition-colors duration-300`}>
            <Sidebar expand={expand} setExpand={setExpand}/>
            <div className={`flex-1 flex flex-col items-center justify-center px-2 sm:px-4 pb-2 ${isDark ? 'bg-[#292a2d] text-white' : 'bg-white text-gray-900'} relative transition-all duration-300 chat-container ${
              showPinnedPanel ? 'chat-container-with-pinned mr-0' : 'mr-0'
            }`}>
            
            {/* Theme Toggle Button */}
            <ThemeToggle />
            
            {/* Pinned messages toggle button - only show when panel is closed */}
            {!showPinnedPanel && (
              <button
                onClick={() => setShowPinnedPanel(true)}
                className={`fixed top-3 right-4 z-20 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-800 hover:bg-gray-900 text-white'} p-2 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-sm`}
                title="Show pinned messages"
              >
                <Image src={assets.pin_icon} alt="Pin" className="w-5 h-5" />
                {pinnedMessages.length > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                    {pinnedMessages.length}
                  </span>
                )}
              </button>
            )}
            {/* Mobile top navigation */}
            <div className="md:hidden absolute px-2 sm:px-4 top-2 sm:top-3 flex items-center justify-between w-full z-30">
              <div className="group relative">
                <Image onClick={()=> (expand ? setExpand(false) : setExpand(true))}
                 className="rotate-180 cursor-pointer w-6 h-6" src={assets.menu_icon} alt=""/>
                <div className="absolute w-max top-10 left-0 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs sm:text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none z-[9999]">
                  {expand ? 'Close menu' : 'Open menu'}
                  <div className="w-3 h-3 absolute bg-black rotate-45 left-4 -top-1.5"></div>
                </div>
              </div>
              
              {/* Display current selected chatflow name */}
              <div className="flex-1 mx-2 sm:mx-4 max-w-xs text-center">
                <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate block`}>
                  {selectedChatflow ? selectedChatflow.name : 'No AI Selected'}
                </span>
              </div>
              
              <div className="group relative">
                <Image 
                  onClick={createNewChat}
                  className="opacity-70 cursor-pointer hover:opacity-100 transition-opacity w-6 h-6" 
                  src={assets.chat_icon} 
                  alt="New chat"
                />
                <div className="absolute w-max top-10 right-0 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs sm:text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none z-[9999]">
                  New chat
                  <div className="w-3 h-3 absolute bg-black rotate-45 right-4 -top-1.5"></div>
                </div>
              </div>
            </div>

            {/* Mobile ChatflowSelector - removed as it's now shown in the middle when chatting */}

            {messages.length === 0 || !selectedChat ? (
              <div className="mt-16 sm:mt-16 md:mt-8 mb-24 md:mb-32 px-4">
              <div className="flex items-center gap-3">
                <Image src={assets.reshot_icon} alt="" className="h-8 sm:h-10 w-8 sm:w-10"/>
                <p className="text-xl sm:text-2xl font-medium">Hi, I'm FirstChat.</p>
              </div>
              <p className="text-xs sm:text-sm mt-2 ml-11 sm:ml-13">
                {selectedChatflow 
                  ? `How can I help you with ${selectedChatflow.name}?` 
                  : 'How can I help you today?'
                }
              </p>
              </div>
            ):
            (
            <div ref={containerRef}
            className="relative flex flex-col items-center justify-start w-full mt-32 md:mt-20 max-h-screen overflow-y-auto"
            > 
            {/* Desktop: Show chat title and chatflow name */}
            <p className={`hidden md:block fixed top-8 border ${isDark ? 'border-transparent hover:border-gray-500/50' : 'border-transparent hover:border-gray-300/50'} py-1 px-2 rounded-lg font-semibold mb-6`}>
              {(selectedChat?.name || 'No Chat Selected').length > 8 
                ? (selectedChat?.name || 'No Chat Selected').substring(0, 8) + '...' 
                : (selectedChat?.name || 'No Chat Selected')}
              {selectedChatflow && (
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-2`}>• {selectedChatflow.name}</span>
              )}
            </p>
            
            {/* Mobile: Show chat title only */}
            <p className="md:hidden fixed top-20 border border-transparent py-1 px-2 rounded-lg font-semibold mb-6 text-sm">
              {(selectedChat?.name || 'No Chat Selected').length > 12 
                ? (selectedChat?.name || 'No Chat Selected').substring(0, 12) + '...' 
                : (selectedChat?.name || 'No Chat Selected')}
            </p>
            {messages.map((msg, index)=>(
              <Message 
                key={`msg-${index}-${msg.role}-${msg.content?.slice(0, 20)}`} 
                role={msg.role} 
                content={msg.content} 
                images={msg.images}
                onPinMessage={handlePinMessage}
                isPinned={isMessagePinned(msg)}
                showPinButton={true}
              />
            ))}
            {
              isLoading && (
                <div className="flex gap-4 max-w-3xl w-full py-3">
                  <Image className={`h-9 w-9 p-1 border ${isDark ? 'border-white/15' : 'border-gray-300'} rounded-full`}
                   src={assets.reshot_icon} alt="Logo"/>
                   <div className="loader flex justify-center items-center gap-1">
                    <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-white' : 'bg-gray-900'} animate-bounce`}></div>
                    <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-white' : 'bg-gray-900'} animate-bounce`}></div>
                    <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-white' : 'bg-gray-900'} animate-bounce`}></div>
                   </div>
                </div>
              )
            }
              
            </div>
          )
          }
          <PromptBox isLoading={isLoading} setIsLoading={setIsLoading}/>
          <p className={`text-xs absolute bottom-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>AI-generated, for reference only</p>

          </div>

          {/* Pinned Messages Panel */}
          <PinnedMessages
            pinnedMessages={pinnedMessages}
            onUnpinMessage={handleUnpinMessage}
            isVisible={showPinnedPanel}
            onToggleVisibility={() => setShowPinnedPanel(!showPinnedPanel)}
          />
        </div>
      </div>
      </ErrorBoundary>
    </LTIAuthGuard>
  );
}
