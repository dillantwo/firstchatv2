'use client';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import Image from 'next/image';

const ControlBar = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <>
      {/* Language Toggle Button - 左上角 */}
      <div className="fixed top-4 left-4 z-30 group">
        <button
          onClick={toggleLanguage}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ease-in-out min-w-[70px]
            ${isDark 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-800 hover:bg-gray-900 text-white opacity-80 hover:opacity-100'
            }
            transform hover:scale-105 active:scale-95 shadow-sm
          `}
          title={t('Switch Language')}
        >
          <span className="text-lg">
            {language === 'zh' ? '🇹🇼' : '🇺🇸'}
          </span>
          <span className="text-sm font-medium hidden sm:inline">
            {language === 'zh' ? 'EN' : '中'}
          </span>
        </button>
        
        {/* Language Toggle Tooltip */}
        <div className="absolute w-max top-12 left-0 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none z-[9999]">
          {t('Switch Language')}
          <div className="w-3 h-3 absolute bg-black rotate-45 left-4 -top-1.5"></div>
        </div>
      </div>

      {/* Theme Toggle Button - 左上角但向右偏移 */}
      <div className="fixed top-4 left-24 z-30 group sm:left-28 md:left-24">
        <button
          onClick={toggleTheme}
          className={`
            flex items-center justify-center p-2 rounded-lg transition-all duration-300 ease-in-out min-w-[44px] min-h-[44px]
            ${isDark 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-800 hover:bg-gray-900 text-white opacity-80 hover:opacity-100'
            }
            transform hover:scale-105 active:scale-95 shadow-sm
          `}
        >
          {isDark ? (
            // 太阳图标 (在深色模式下显示，表示可以切换到浅色模式)
            <svg 
              className="w-5 h-5 transition-transform duration-300" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
            </svg>
          ) : (
            // 月亮图标 (在浅色模式下显示，表示可以切换到深色模式)
            <svg 
              className="w-5 h-5 transition-transform duration-300" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        {/* Theme Toggle Tooltip */}
        <div className="absolute w-max top-12 left-0 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none z-[9999]">
          {t(isDark ? 'Switch to light mode' : 'Switch to dark mode')}
          <div className="w-3 h-3 absolute bg-black rotate-45 left-4 -top-1.5"></div>
        </div>
      </div>
    </>
  );
};

export default ControlBar;
