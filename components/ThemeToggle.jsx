'use client';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { assets } from '@/assets/assets';
import Image from 'next/image';

const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="fixed top-3 right-28 z-30 group">
      <button
        onClick={toggleTheme}
        className={`
          flex items-center justify-center p-2 rounded-lg transition-all duration-300 ease-in-out
          ${isDark 
            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
            : 'bg-gray-800 hover:bg-gray-900 text-white opacity-70 hover:opacity-100'
          }
          transform hover:scale-105 active:scale-95 shadow-sm
        `}
        title={t(isDark ? 'Switch to light mode' : 'Switch to dark mode')}
      >
        {/* 太阳图标 (浅色模式下显示，表示当前是浅色模式) */}
        <div className={`transition-all duration-300 ${isDark ? 'opacity-0 rotate-180 scale-0' : 'opacity-100 rotate-0 scale-100'}`}>
          <Image 
            src={assets.sun_svg}
            alt="Sun Icon"
            width={20}
            height={20}
            className="w-5 h-5 filter brightness-0 invert transition-all duration-300"
          />
        </div>
        
        {/* 月亮图标 (深色模式下显示，表示当前是深色模式) */}
        <div className={`absolute transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-180 scale-0'}`}>
          <Image 
            src={assets.moon_svg}
            alt="Moon Icon"
            width={20}
            height={20}
            className="w-5 h-5 filter brightness-0 invert transition-all duration-300"
          />
        </div>
      </button>
      
      {/* Tooltip */}
      <div className="absolute w-max top-10 right-0 opacity-0 group-hover:opacity-100 transition bg-black text-white text-xs sm:text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none z-[9999]">
        {t(isDark ? 'Switch to light mode' : 'Switch to dark mode')}
        <div className="w-3 h-3 absolute bg-black rotate-45 right-4 -top-1.5"></div>
      </div>
    </div>
  );
};

export default ThemeToggle;
