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
import { useLanguage } from "@/context/LanguageContext";
import { useHydration } from "@/utils/useHydration";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import toast from 'react-hot-toast';

export default function Home() {

  const [expand, setExpand] = useState(false)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [pinnedMessages, setPinnedMessages] = useState([])
  const [showPinnedPanel, setShowPinnedPanel] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const {selectedChat, selectedChatflow, handleChatflowChange, createNewChat} = useAppContext()
  const { isDark, toggleTheme } = useTheme()
  const { t, currentLanguage, changeLanguage } = useLanguage()
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

  // Handle preview modal state change
  const handlePreviewModalChange = (isOpen) => {
    setIsPreviewModalOpen(isOpen);
  };

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
      // Show appropriate toast message
      if (message.isHtmlOnly) {
        toast.success(t('HTML content unpinned'));
      } else {
        toast.success(t('Message unpinned'));
      }
    } else {
      // Pin message
      setPinnedMessages(prev => [...prev, { ...message, timestamp: Date.now() }]);
      if (!showPinnedPanel) {
        setShowPinnedPanel(true);
      }
      // Show appropriate toast message
      if (message.isHtmlOnly) {
        toast.success(t('HTML content pinned'));
      } else {
        toast.success(t('Message pinned'));
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
    const isFullMessagePinned = pinnedMessages.some(pinned => 
      `${pinned.role}-${pinned.content?.slice(0, 100)?.replace(/\s/g, '')}` === messageId
    );
    
    // Also check if HTML content is pinned separately
    const htmlCodeRegex = /```html\s*\n([\s\S]*?)\n```/gi;
    const htmlMatch = htmlCodeRegex.exec(message.content || '');
    if (htmlMatch && htmlMatch[1]) {
      const htmlContent = `\`\`\`html\n${htmlMatch[1].trim()}\n\`\`\``;
      const htmlMessageId = `${message.role}-${htmlContent.slice(0, 100).replace(/\s/g, '')}`;
      const isHtmlPinned = pinnedMessages.some(pinned => 
        `${pinned.role}-${pinned.content?.slice(0, 100)?.replace(/\s/g, '')}` === htmlMessageId
      );
      return isFullMessagePinned || isHtmlPinned;
    }
    
    return isFullMessagePinned;
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
            <Sidebar expand={expand} setExpand={setExpand} isPreviewModalOpen={isPreviewModalOpen}/>
            <div className={`flex-1 flex flex-col items-center justify-center px-2 sm:px-4 pb-2 ${isDark ? 'bg-[#292a2d] text-white' : 'bg-white text-gray-900'} relative transition-all duration-300 chat-container ${
              showPinnedPanel ? 'chat-container-with-pinned mr-0' : 'mr-0'
            }`}>
            
            {/* Unified Top Navigation Bar for both Mobile and Desktop */}
            <div className="absolute px-2 sm:px-4 top-2 sm:top-3 flex items-center justify-between w-full z-30">
              {/* Menu Button */}
              <div className="group relative">
                <Image onClick={()=> (expand ? setExpand(false) : setExpand(true))}
                 className="rotate-180 cursor-pointer w-6 h-6" src={assets.menu_icon} alt=""/>
                <div className="absolute w-max top-10 left-0 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs sm:text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none z-[9999]">
                  {expand ? t('Close menu') : t('Open menu')}
                  <div className="w-3 h-3 absolute bg-black rotate-45 left-4 -top-1.5"></div>
                </div>
              </div>
              
              {/* Current chatflow or chat name */}
              <div className="flex-1 mx-2 sm:mx-4 max-w-xs text-center">
                {/* Desktop: Show both chat name and chatflow name */}
                <div className="hidden md:block">
                  <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'} block truncate`}>
                    {selectedChat?.name || t('No Chat Selected')}
                  </span>
                  {selectedChatflow && (
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} block truncate`}>
                      {selectedChatflow.name}
                    </span>
                  )}
                </div>
                
                {/* Mobile: Show only chatflow name */}
                <div className="md:hidden">
                  <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate block`}>
                    {selectedChatflow ? selectedChatflow.name : t('No AI Selected')}
                  </span>
                </div>
              </div>
              
              {/* Right side buttons */}
              <div className="flex items-center gap-2">
                {/* Theme Toggle Button */}
                {!isPreviewModalOpen && (
                  <div className="group relative hidden md:block">
                    <button
                      onClick={toggleTheme}
                      className={`
                        ${isDark 
                          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                          : 'bg-gray-800 hover:bg-gray-900 text-white'
                        } 
                        p-2 rounded-lg transition-colors duration-200 flex items-center justify-center shadow-sm min-h-[40px] min-w-[40px]
                      `}
                      title={t(isDark ? 'Switch to light mode' : 'Switch to dark mode')}
                    >
                      {isDark ? (
                        <Image 
                          src={assets.moon_svg}
                          alt="Moon Icon"
                          width={20}
                          height={20}
                          className="w-5 h-5 filter brightness-0 invert"
                        />
                      ) : (
                        <Image 
                          src={assets.sun_svg}
                          alt="Sun Icon"
                          width={20}
                          height={20}
                          className="w-5 h-5 filter brightness-0 invert"
                        />
                      )}
                    </button>
                    <div className="absolute w-max top-12 right-0 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none z-[9999]">
                      {t(isDark ? 'Switch to light mode' : 'Switch to dark mode')}
                      <div className="w-3 h-3 absolute bg-black rotate-45 right-4 -top-1.5"></div>
                    </div>
                  </div>
                )}
                
                {/* Language Toggle Button */}
                {!isPreviewModalOpen && (
                  <div className="group relative hidden md:block">
                    <button
                      onClick={() => changeLanguage(currentLanguage === 'zh' ? 'en' : 'zh')}
                      className={`
                        ${isDark 
                          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                          : 'bg-gray-800 hover:bg-gray-900 text-white'
                        } 
                        p-2 rounded-lg transition-colors duration-200 flex items-center justify-center shadow-sm min-h-[40px] min-w-[40px]
                      `}
                      title={t('Switch Language')}
                    >
                      <span className="text-sm font-medium leading-none text-center">
                        {currentLanguage === 'zh' ? '中' : 'EN'}
                      </span>
                    </button>
                    <div className="absolute w-max top-12 right-0 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none z-[9999]">
                      {t('Switch Language')}
                      <div className="w-3 h-3 absolute bg-black rotate-45 right-4 -top-1.5"></div>
                    </div>
                  </div>
                )}
                
                {/* Pin Messages Button */}
                {!isPreviewModalOpen && (
                  <div className="group relative">
                    <button
                      onClick={() => setShowPinnedPanel(!showPinnedPanel)}
                      className={`
                        ${isDark 
                          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                          : 'bg-gray-800 hover:bg-gray-900 text-white'
                        } 
                        p-2 rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-sm min-h-[40px] min-w-[40px]
                      `}
                      title={t(showPinnedPanel ? "Hide pinned messages" : "Show pinned messages")}
                    >
                      <Image src={assets.pin_svgrepo_com} alt={t("Pin")} className="w-5 h-5 brightness-0 invert" />
                      {pinnedMessages.length > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 -ml-1">
                          {pinnedMessages.length}
                        </span>
                      )}
                    </button>
                    <div className="absolute w-max top-12 right-0 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none z-[9999]">
                      {t(showPinnedPanel ? "Hide pinned messages" : "Show pinned messages")}
                      <div className="w-3 h-3 absolute bg-black rotate-45 right-4 -top-1.5"></div>
                    </div>
                  </div>
                )}
                
                {/* New Chat Button */}
                <div className="group relative">
                  <Image 
                    onClick={createNewChat}
                    className="opacity-70 cursor-pointer hover:opacity-100 transition-opacity w-6 h-6" 
                    src={assets.chat_icon} 
                    alt={t("New chat")}
                  />
                  <div className="absolute w-max top-10 right-0 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs sm:text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none z-[9999]">
                    {t("New chat")}
                    <div className="w-3 h-3 absolute bg-black rotate-45 right-4 -top-1.5"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile ChatflowSelector - removed as it's now shown in the middle when chatting */}

            {messages.length === 0 || !selectedChat ? (
              <div className="mt-20 sm:mt-20 md:mt-20 mb-24 md:mb-32 px-4">
              <div className="flex items-center gap-3">
                <Image src={assets.reshot_icon} alt="" className="h-8 sm:h-10 w-8 sm:w-10"/>
                <p className="text-xl sm:text-2xl font-medium">{t("Hi, I'm AI ChatBot.")}</p>
              </div>
              <p className="text-xs sm:text-sm mt-2 ml-11 sm:ml-13">
                {selectedChatflow 
                  ? t('How can I help you with') + ` ${selectedChatflow.name}?` 
                  : t('How can I help you today?')
                }
              </p>
              </div>
            ):
            (
            <div ref={containerRef}
            className="relative flex flex-col items-center justify-start w-full chat-container-margin max-h-screen overflow-y-auto"
            > 
            {messages.map((msg, index)=>(
              <Message 
                key={`msg-${index}-${msg.role}-${msg.content?.slice(0, 20)}`} 
                role={msg.role} 
                content={msg.content} 
                images={msg.images}
                documents={msg.documents}
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
          <PromptBox 
            isLoading={isLoading} 
            setIsLoading={setIsLoading}
            onPreviewModalChange={handlePreviewModalChange}
            showPinnedPanel={showPinnedPanel}
          />
          <p className={`text-xs absolute bottom-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t("AI-generated, for reference only")}</p>

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