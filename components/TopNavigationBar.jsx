'use client';
import { useAppContext } from '@/context/AppContextLTI';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { assets } from '@/assets/assets';
import Image from 'next/image';

const TopNavigationBar = ({ 
  expand, 
  setExpand, 
  showPinnedPanel, 
  setShowPinnedPanel, 
  pinnedMessages, 
  createNewChat, 
  isPreviewModalOpen 
}) => {
  const { selectedChat, selectedChatflow } = useAppContext();
  const { toggleTheme, isDark } = useTheme();
  const { currentLanguage, changeLanguage, t } = useLanguage();

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-inherit flex items-center justify-between px-2 sm:px-4 z-30 border-b border-gray-200/20">
      {/* Menu Button */}
      <div className="group relative">
        <Image 
          onClick={() => (expand ? setExpand(false) : setExpand(true))}
          className="rotate-180 cursor-pointer w-6 h-6" 
          src={assets.menu_icon} 
          alt=""
        />
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
  );
};

export default TopNavigationBar;
