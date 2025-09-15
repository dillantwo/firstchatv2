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
import TopNavigationBar from "@/components/TopNavigationBar";
import { useAppContext } from "@/context/AppContextLTI";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useHydration } from "@/utils/useHydration";
import Image from "next/image";
import { useEffect, useRef, useState, useCallback } from "react";
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
  const handlePreviewModalChange = useCallback((isOpen) => {
    setIsPreviewModalOpen(isOpen);
  }, []);

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
        
        {/* 独立的顶部导航栏 */}
        <TopNavigationBar 
          expand={expand}
          setExpand={setExpand}
          showPinnedPanel={showPinnedPanel}
          setShowPinnedPanel={setShowPinnedPanel}
          pinnedMessages={pinnedMessages}
          createNewChat={createNewChat}
          isPreviewModalOpen={isPreviewModalOpen}
        />
        
        <div className={`main-container ${isDark ? 'bg-[#292a2d]' : 'bg-white'} transition-colors duration-300`}>
        <div className={`flex h-screen ${isDark ? 'bg-[#292a2d]' : 'bg-white'} transition-colors duration-300`} style={{ paddingTop: '4rem' }}>
          <Sidebar expand={expand} setExpand={setExpand} isPreviewModalOpen={isPreviewModalOpen}/>
          <div className={`flex-1 flex flex-col items-center justify-center px-2 sm:px-4 pb-2 ${isDark ? 'bg-[#292a2d] text-white' : 'bg-white text-gray-900'} relative transition-all duration-300 chat-container ${
            showPinnedPanel ? 'chat-container-with-pinned mr-0' : 'mr-0'
          }`}>

            {/* Mobile ChatflowSelector - removed as it's now shown in the middle when chatting */}

            {messages.length === 0 || !selectedChat ? (
              <div className="pt-4 mb-24 md:mb-32 px-4">
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
            className="relative flex flex-col items-center justify-start w-full max-h-screen overflow-y-auto"
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
          <p className={`text-xs absolute bottom-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t("AI-generated, for reference only")}</p>

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