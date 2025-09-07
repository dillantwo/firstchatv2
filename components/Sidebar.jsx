import { assets } from '@/assets/assets'
import Image from 'next/image'
import React, { useState, useEffect } from 'react'
import { useLTIAuth } from '@/context/LTIAuthContext'
import { useAppContext } from '@/context/AppContextLTI'
import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import ChatLabel from './ChatLabel'

const Sidebar = ({expand, setExpand, isPreviewModalOpen = false}) => {

    const { user, logout } = useLTIAuth()
    const {filteredChats, selectedChatflow, createNewChat} = useAppContext()
    const { isDark } = useTheme()
    const { t } = useLanguage()
    const [openMenu, setOpenMenu] = useState({id: 0, open: false})
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [isIPadPortrait, setIsIPadPortrait] = useState(false)

    // 检测iPad竖屏模式
    useEffect(() => {
        const checkIPadPortrait = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const isTablet = width <= 1024 && width > 768;
            const isPortrait = height > width;
            setIsIPadPortrait(isTablet && isPortrait);
        };

        checkIPadPortrait();
        window.addEventListener('resize', checkIPadPortrait);
        window.addEventListener('orientationchange', checkIPadPortrait);

        return () => {
            window.removeEventListener('resize', checkIPadPortrait);
            window.removeEventListener('orientationchange', checkIPadPortrait);
        };
    }, []);

    // 在iPad竖屏模式下，如果预览模态框打开，则隐藏侧边栏
    const shouldHideSidebar = isIPadPortrait && isPreviewModalOpen;

  // 在iPad竖屏模式下，如果预览模态框打开，则不渲染侧边栏
  if (shouldHideSidebar) {
    return null;
  }

  return (
    <div className={`flex flex-col justify-between ${isDark ? 'bg-[#212327]' : 'bg-gray-50 border-r border-gray-200'} pt-7 transition-all z-50 max-md:absolute max-md:h-screen max-md:h-[100vh] max-md:h-[-webkit-fill-available] overflow-hidden ${expand ? 'p-4 w-64 min-w-64' : 'md:w-20 w-0 max-md:overflow-hidden'}`}>
      <div className="flex flex-col min-h-0 flex-1">
        <div className={`flex ${expand ? "flex-row gap-10" : "flex-col items-center gap-8"}`}>
            <div className={`${expand && isDark ? 'bg-white/90 rounded-lg px-3 py-2' : ''} transition-all duration-300`}>
                <Image className={expand ? "w-36" : "w-10"} src={expand ? assets.logo_text : assets.reshot_icon} alt=''/>
            </div>

            <div onClick={()=> expand ? setExpand(false) : setExpand(true)}
             className={`group relative flex items-center justify-center ${isDark ? 'hover:bg-gray-500/20' : 'hover:bg-gray-300'} transition-all duration-300 h-9 w-9 aspect-square rounded-lg cursor-pointer`}>
                <Image src={assets.menu_icon} alt='' className='md:hidden'/>
                <Image src={expand ? assets.sidebar_close_icon : assets.sidebar_icon} alt='' className='hidden md:block w-7'/>
            </div>
        </div>

        <button onClick={createNewChat} className={`mt-8 flex items-center justify-center cursor-pointer select-none ${expand ? "bg-primary hover:opacity-90 rounded-2xl gap-2 p-2.5 w-max" : `group relative h-9 w-9 mx-auto ${isDark ? 'hover:bg-gray-500/30' : 'hover:bg-gray-300'} rounded-lg`}`}>
            <Image className={expand ? 'w-6' : 'w-7'} src={expand ? assets.chat_icon : assets.chat_icon_dull} alt=''/>
            {!expand && (
                <div className={`absolute w-max -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition ${isDark ? 'bg-black text-white' : 'bg-gray-800 text-white'} text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none z-[9999]`}>
                    {t('New chat')}
                    <div className={`w-3 h-3 absolute ${isDark ? 'bg-black' : 'bg-gray-800'} rotate-45 left-1/2 -bottom-1.5 -translate-x-1/2`}></div>
                </div>
            )}
            {expand && <p className={`${isDark ? 'text-white' : 'text-white'} text font-medium select-none`}>{t('New chat')}</p>}
        </button>

        <div className={`mt-8 ${isDark ? 'text-white/25' : 'text-gray-500'} text-sm flex-1 flex flex-col min-h-0 ${expand ? "block" : "hidden"}`}>
            <div className={`mb-4 flex-shrink-0 ${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>
                <div className="flex gap-2">
                    {selectedChatflow && (
                        <div className={`w-2 h-2 rounded-full ${selectedChatflow.deployed ? 'bg-green-500' : 'bg-gray-500'} mt-1 flex-shrink-0`} />
                    )}
                    <div className="flex-1 min-w-0">
                        <span className="text-sm leading-5 block word-break break-all whitespace-normal select-none">
                            {selectedChatflow ? `${selectedChatflow.name} ${t('Chats')}` : t('Recent Chats')}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex-1 chat-list-container min-h-0 pr-2">
                {filteredChats.length > 0 ? (
                    filteredChats.map((chat)=> 
                        <ChatLabel key={chat._id} name={chat.name} id={chat._id} openMenu={openMenu} setOpenMenu={setOpenMenu}/>
                    )
                ) : (
                    <div className="text-center py-8 select-none">
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm mb-2`}>
                            {selectedChatflow 
                                ? `${t('No chats for')} ${selectedChatflow.name}` 
                                : t('No chats available')
                            }
                        </p>
                        <p className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs`}>
                            {selectedChatflow 
                                ? t('Start a new conversation with this chatflow')
                                : t('Create your first chat to get started')
                            }
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>

    <div className="flex-shrink-0">
        <div className={`relative flex items-center ${expand ? ` ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'} rounded-lg` : 'justify-center w-full'} gap-3 ${isDark ? 'text-white/60' : 'text-gray-600'} text-sm p-2 cursor-pointer`}>
            {user ? (
                <>
                    <div 
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center gap-2"
                    >
                        {user.picture ? (
                            <img 
                                src={user.picture} 
                                alt="Profile" 
                                className="w-7 h-7 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                        )}
                        {expand && <span className="truncate select-none">{user.username || user.name || user.email}</span>}
                    </div>
                    
                    {showUserMenu && expand && (
                        <div className={`absolute bottom-full left-0 right-0 mb-2 ${isDark ? 'bg-[#2a2b2f] border-gray-600/30' : 'bg-white border-gray-200'} border rounded-lg p-3 shadow-lg`}>
                            <div className="mb-3">
                                <p className={`${isDark ? 'text-white' : 'text-gray-900'} text-sm font-medium truncate`}>{user.username || user.name}</p>
                                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs truncate`}>{user.email}</p>
                                {user.context_title && (
                                    <p className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs truncate mt-1`}>{user.context_title}</p>
                                )}
                            </div>
                            
                            <button
                                onClick={logout}
                                className={`w-full text-left text-red-400 hover:text-red-300 text-sm py-1 px-2 rounded ${isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'} transition-colors`}
                            >
                                {t('Logout')}
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <Image src={assets.profile_icon} alt='' className='w-7'/>
            )}
        </div>
    </div>

    </div>
  )
}

export default Sidebar
