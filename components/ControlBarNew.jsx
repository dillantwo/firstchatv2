'use client';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { assets } from '@/assets/assets';
import Image from 'next/image';

const ControlBar = ({ showPinnedPanel = false, hideControls = false }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { currentLanguage: language, changeLanguage, t } = useLanguage();
  
  const toggleLanguage = () => {
    changeLanguage(language === 'zh' ? 'en' : 'zh');
  };

  // 当钉选面板打开时或需要隐藏控制按钮时隐藏控制按钮
  if (showPinnedPanel || hideControls) {
    return null;
  }

  return (
    <>
      {/* Language Toggle Button - 中间位置 */}
      <div className="fixed top-3 right-20 z-30 group">
        <button
          onClick={toggleLanguage}
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
            {language === 'zh' ? '中' : 'EN'}
          </span>
        </button>
        
        {/* Language Toggle Tooltip */}
        <div className="absolute w-max top-12 right-0 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none z-[9999]">
          {t('Switch Language')}
          <div className="w-3 h-3 absolute bg-black rotate-45 right-4 -top-1.5"></div>
        </div>
      </div>

      {/* Theme Toggle Button - 左侧位置 */}
      <div className="fixed top-3 right-32 z-30 group ipad-theme-button">
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
            // 月亮图标 (在深色模式下显示，表示当前是深色模式)
            <Image 
              src={assets.moon_svg}
              alt="Moon Icon"
              width={20}
              height={20}
              className="w-5 h-5 filter brightness-0 invert transition-all duration-300"
            />
          ) : (
            // 太阳图标 (在浅色模式下显示，表示当前是浅色模式)
            <Image 
              src={assets.sun_svg}
              alt="Sun Icon"
              width={20}
              height={20}
              className="w-5 h-5 filter brightness-0 invert transition-all duration-300"
            />
          )}
        </button>
        
        {/* Theme Toggle Tooltip */}
        <div className="absolute w-max top-12 right-0 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none z-[9999]">
          {t(isDark ? 'Switch to light mode' : 'Switch to dark mode')}
          <div className="w-3 h-3 absolute bg-black rotate-45 right-4 -top-1.5"></div>
        </div>
      </div>
    </>
  );
};

export default ControlBar;
