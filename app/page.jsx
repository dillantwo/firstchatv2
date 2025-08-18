'use client';
import { assets } from "@/assets/assets";
import Message from "@/components/Message";
import PromptBox from "@/components/PromptBox";
import Sidebar from "@/components/Sidebar";
import ChatflowSelector from "@/components/ChatflowSelector";
import LTIAuthGuard from "@/components/LTIAuthGuard";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAppContext } from "@/context/AppContextLTI";
import { useHydration } from "@/utils/useHydration";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function Home() {

  const [expand, setExpand] = useState(false)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const {selectedChat, selectedChatflow, handleChatflowChange, createNewChat} = useAppContext()
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

  // Don't render until hydrated to prevent mismatches
  if (!hasHydrated) {
    return null;
  }



  return (
    <LTIAuthGuard>
      <ErrorBoundary>
        <div>
          <div className="flex h-screen">
            <Sidebar expand={expand} setExpand={setExpand}/>
            <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 bg-[#292a2d] text-white relative">
            {/* Mobile top navigation */}
            <div className="md:hidden absolute px-4 top-6 flex items-center justify-between w-full">
              <div className="group relative">
                <Image onClick={()=> (expand ? setExpand(false) : setExpand(true))}
                 className="rotate-180 cursor-pointer" src={assets.menu_icon} alt=""/>
                <div className="absolute w-max top-10 left-0 opacity-0 group-hover:opacity-100 transition bg-black text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none z-[9999]">
                  {expand ? 'Close menu' : 'Open menu'}
                  <div className="w-3 h-3 absolute bg-black rotate-45 left-4 -top-1.5"></div>
                </div>
              </div>
              
              {/* Mobile ChatflowSelector in the middle of navigation */}
              <div className="flex-1 mx-4 max-w-xs">
                <ChatflowSelector 
                  selectedChatflow={selectedChatflow} 
                  onChatflowChange={handleChatflowChange} 
                />
              </div>
              
              <div className="group relative">
                <Image 
                  onClick={createNewChat}
                  className="opacity-70 cursor-pointer hover:opacity-100 transition-opacity" 
                  src={assets.chat_icon} 
                  alt="New chat"
                />
                <div className="absolute w-max top-10 right-0 opacity-0 group-hover:opacity-100 transition bg-black text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none z-[9999]">
                  New chat
                  <div className="w-3 h-3 absolute bg-black rotate-45 right-4 -top-1.5"></div>
                </div>
              </div>
            </div>

            {/* Desktop ChatflowSelector */}
            <div className="hidden md:block absolute top-6 left-6 z-10">
              <ChatflowSelector 
                selectedChatflow={selectedChatflow} 
                onChatflowChange={handleChatflowChange} 
              />
            </div>

            {/* Mobile ChatflowSelector - removed as it's now shown in the middle when chatting */}

            {messages.length === 0 || !selectedChat ? (
              <div className="mt-16 md:mt-8 mb-24 md:mb-32">
              <div className="flex items-center gap-3">
                <Image src={assets.reshot_icon} alt="" className="h-10"/>
                <p className="text-2xl font-medium">Hi, I'm FirstChat.</p>
              </div>
              <p className="text-sm mt-2 ml-13">
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
            <p className="hidden md:block fixed top-8 border border-transparent hover:border-gray-500/50 py-1 px-2 rounded-lg font-semibold mb-6">
              {(selectedChat?.name || 'No Chat Selected').length > 8 
                ? (selectedChat?.name || 'No Chat Selected').substring(0, 8) + '...' 
                : (selectedChat?.name || 'No Chat Selected')}
              {selectedChatflow && (
                <span className="text-xs text-gray-400 ml-2">• {selectedChatflow.name}</span>
              )}
            </p>
            
            {/* Mobile: Show chat title only */}
            <p className="md:hidden fixed top-20 border border-transparent py-1 px-2 rounded-lg font-semibold mb-6 text-sm">
              {(selectedChat?.name || 'No Chat Selected').length > 12 
                ? (selectedChat?.name || 'No Chat Selected').substring(0, 12) + '...' 
                : (selectedChat?.name || 'No Chat Selected')}
            </p>
            {messages.map((msg, index)=>(
              <Message key={`msg-${index}-${msg.role}-${msg.content?.slice(0, 20)}`} role={msg.role} content={msg.content} images={msg.images}/>
            ))}
            {
              isLoading && (
                <div className="flex gap-4 max-w-3xl w-full py-3">
                  <Image className="h-9 w-9 p-1 border border-white/15 rounded-full"
                   src={assets.reshot_icon} alt="Logo"/>
                   <div className="loader flex justify-center items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
                    <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
                    <div className="w-1 h-1 rounded-full bg-white animate-bounce"></div>
                   </div>
                </div>
              )
            }
              
            </div>
          )
          }
          <PromptBox isLoading={isLoading} setIsLoading={setIsLoading}/>
          <p className="text-xs absolute bottom-1 text-gray-500">AI-generated, for reference only</p>

          </div>
        </div>
      </div>
      </ErrorBoundary>
    </LTIAuthGuard>
  );
}
