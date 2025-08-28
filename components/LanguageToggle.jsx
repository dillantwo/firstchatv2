'use client'

import React from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useTheme } from '@/context/ThemeContext'

const LanguageToggle = () => {
  const { currentLanguage, changeLanguage, t } = useLanguage()
  const { isDark } = useTheme()

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'zh' ? 'en' : 'zh'
    changeLanguage(newLanguage)
  }

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
        isDark 
          ? 'hover:bg-white/10 text-white/80 hover:text-white' 
          : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
      }`}
      title={currentLanguage === 'zh' ? t('Switch to English') : t('Switch to Traditional Chinese')}
    >
      <span className="text-lg">
        {currentLanguage === 'zh' ? '🇺🇸' : '🇹🇼'}
      </span>
      <span className="font-medium">
        {currentLanguage === 'zh' ? 'EN' : '中'}
      </span>
    </button>
  )
}

export default LanguageToggle
