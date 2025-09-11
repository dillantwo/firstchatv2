'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

// 翻譯文件
const translations = {
  zh: {
    // Sidebar
    'New chat': '新對話',
    'Recent Chats': '最近對話',
    'Chats': '對話',
    'No chats available': '暫無對話',
    'Create your first chat to get started': '建立您的第一個對話開始使用',
    'No chats for': '沒有對話',
    'Start a new conversation with this chatflow': '開始使用此聊天流程進行新對話',
    'Logout': '登出',
    
    // ChatLabel
    'Rename': '重新命名',
    'Delete': '刪除',
    'Enter new name': '輸入新名稱',
    'Rename Chat': '重新命名對話',
    'Name cannot be empty': '名稱不能為空',
    'Delete Chat': '刪除對話',
    'Are you sure you want to delete this chat? This action cannot be undone.': '您確定要刪除此對話嗎？此操作無法復原。',
    
    // PromptBox
    'Type a message, drag images, or use voice input...': '輸入訊息或使用語音輸入...',
    'Drag images here to upload...': '點擊上傳檔案...',
    'Continuous listening...': '持續聆聽中...',
    'Upload Image': '上傳文件 (圖片/Word/PDF)',
    'Voice Input': '語音輸入',
    'Select voice recognition language': '選擇語音辨識語言',
    'Cannot change language during voice input': '語音輸入期間無法更改語言',
    'Click to start continuous voice input': '點擊開始持續語音輸入',
    'Click to stop continuous recording': '點擊停止連續錄音',
    'Please select a chatflow first': '請先選擇聊天流程',
    'Click to stop response': '點擊停止回應',
    'Response stopped': '回應已停止',
    'Stop': '停止',
    'Send': '發送',
    'Let\'s learn': '開始學習',
    'Please continue': '請繼續',
    'Your browser does not support speech recognition feature': '您的瀏覽器不支援語音辨識功能',
    
    // Message
    'Copy': '複製',
    'Code': '程式碼',
    'Preview': '預覽',
    'Message copied to clipboard': '訊息已複製到剪貼簿',
    'HTML code copied to clipboard': 'HTML 程式碼已複製到剪貼簿',
    'Pin message': '釘選訊息',
    'Unpin message': '取消釘選訊息',
    'Message pinned': '訊息已釘選',
    'Message unpinned': '訊息已取消釘選',
    'Pin': '釘選',
    'Unpin': '取消釘選',
    'Pin HTML content': '釘選 HTML 內容',
    'Unpin HTML content': '取消釘選 HTML 內容',
    'Copy message': '複製訊息',
    'Image': '圖片',
    'HTML Render Preview': 'HTML 渲染預覽',
    
    // PinnedMessages
    'Pinned': '已釘選',
    'Pinned Messages': '釘選訊息',
    'No pins': '無釘選',
    'No pinned messages yet': '尚無釘選訊息',
    'Click the pin icon on any message to save it here': '點擊任何訊息的釘選圖示以儲存到此處',
    'You': '您',
    'HTML content pinned': 'HTML 內容已釘選',
    'HTML content unpinned': 'HTML 內容已取消釘選',
    'Show pinned messages': '顯示釘選訊息',
    
    // Page Navigation
    'Close menu': '關閉選單',
    'Open menu': '開啟選單',
    'No AI Selected': '未選擇 AI',
    'No Chat Selected': '未選擇對話',
    'Hi, I\'m AI ChatBot.': '您好，我是 AI ChatBot。',
    'How can I help you with': '我如何協助您使用',
    'How can I help you today?': '今天我能為您做些什麼？',
    'AI-generated, for reference only': 'AI 生成內容，僅供參考',
    
    // Theme Toggle
    'Switch to light mode': '切換到淺色模式',
    'Switch to dark mode': '切換到深色模式',
    'Light mode': '淺色模式',
    'Dark mode': '深色模式',
    
    // Common UI
    'Loading...': '載入中...',
    'Uploading': '上傳中',
    'Cancel upload': '取消上傳',
    'Error': '錯誤',
    'Success': '成功',
    'Cancel': '取消',
    'Confirm': '確認',
    'Save': '儲存',
    'Edit': '編輯',
    'Remove': '移除',
    'Add': '新增',
    'Search': '搜尋',
    'Settings': '設定',
    'Close': '關閉',
    'Open': '開啟',
    'Back': '返回',
    'Next': '下一步',
    'Previous': '上一步',
    'Finish': '完成',
    'Submit': '提交',
    'Reset': '重設',
    'Clear': '清除',
    'Select': '選擇',
    'All': '全部',
    'None': '無',
    'Yes': '是',
    'No': '否',
    'OK': '確定',
    
    // Toast messages
    'Wait for the previous prompt response': '請等待上一個提示的回應',
    'Please access this tool through Moodle LTI': '請透過 Moodle LTI 存取此工具',
    'Failed to send message': '訊息發送失敗',
    'Failed to create new chat. Please try again.': '建立新對話失敗，請重試',
    'Failed to find created chat.': '找不到已建立的對話',
    'Failed to retrieve chat after creation.': '建立後無法取得對話',
    'AI 响应速度较慢，建议检查网络连接': 'AI 回應速度較慢，建議檢查網路連線',
    
    // API Error messages
    'User not authenticated': '用戶未驗證',
    'Invalid session': '無效的會話',
    'Prompt is required': '提示內容為必填',
    'Chatflow selection is required': '必須選擇聊天流程',
    'User not found': '找不到用戶',
    'No course association found': '找不到課程關聯',
    'You do not have permission to use this chatflow': '您沒有權限使用此聊天流程',
    'Chat not found': '找不到對話',
    'Request timeout - AI service took too long to respond': '請求超時 - AI 服務回應時間過長',
    'An error occurred while processing your request': '處理您的請求時發生錯誤',
    
    // SimpleChatflowSelector
    'Select Chatflow': '選擇聊天流程',
    'All Chatflows': '所有聊天流程',
    'No chatflows available': '沒有可用的聊天流程',
    
    // Language Toggle
    'Language': '語言',
    'Switch to English': '切換至英文',
    'Switch to Traditional Chinese': '切換至繁體中文'
  },
  en: {
    // Sidebar
    'New chat': 'New chat',
    'Recent Chats': 'Recent Chats',
    'Chats': 'Chats',
    'No chats available': 'No chats available',
    'Create your first chat to get started': 'Create your first chat to get started',
    'No chats for': 'No chats for',
    'Start a new conversation with this chatflow': 'Start a new conversation with this chatflow',
    'Logout': 'Logout',
    
    // ChatLabel
    'Rename': 'Rename',
    'Delete': 'Delete',
    'Enter new name': 'Enter new name',
    'Rename Chat': 'Rename Chat',
    'Name cannot be empty': 'Name cannot be empty',
    'Delete Chat': 'Delete Chat',
    'Are you sure you want to delete this chat? This action cannot be undone.': 'Are you sure you want to delete this chat? This action cannot be undone.',
    
    // PromptBox
    'Type a message, drag images, or use voice input...': 'Type a message or use voice input...',
    'Drag images here to upload...': 'Click to upload files...',
    'Continuous listening...': 'Continuous listening...',
    'Upload Image': 'Upload Files (Images, Word, PDF)',
    'Voice Input': 'Voice Input',
    'Select voice recognition language': 'Select voice recognition language',
    'Cannot change language during voice input': 'Cannot change language during voice input',
    'Click to start continuous voice input': 'Click to start continuous voice input',
    'Click to stop continuous recording': 'Click to stop continuous recording',
    'Please select a chatflow first': 'Please select a chatflow first',
    'Click to stop response': 'Click to stop response',
    'Response stopped': 'Response stopped',
    'Stop': 'Stop',
    'Send': 'Send',
    'Let\'s learn': 'Let\'s learn',
    'Please continue': 'Please continue',
    'Your browser does not support speech recognition feature': 'Your browser does not support speech recognition feature',
    
    // Message
    'Copy': 'Copy',
    'Code': 'Code',
    'Preview': 'Preview',
    'Message copied to clipboard': 'Message copied to clipboard',
    'HTML code copied to clipboard': 'HTML code copied to clipboard',
    'Pin message': 'Pin message',
    'Unpin message': 'Unpin message',
    'Message pinned': 'Message pinned',
    'Message unpinned': 'Message unpinned',
    'Pin': 'Pin',
    'Unpin': 'Unpin',
    'Pin HTML content': 'Pin HTML content',
    'Unpin HTML content': 'Unpin HTML content',
    'Copy message': 'Copy message',
    'Image': 'Image',
    'HTML Render Preview': 'HTML Render Preview',
    
    // PinnedMessages
    'Pinned': 'Pinned',
    'Pinned Messages': 'Pinned Messages',
    'No pins': 'No pins',
    'No pinned messages yet': 'No pinned messages yet',
    'Click the pin icon on any message to save it here': 'Click the pin icon on any message to save it here',
    'You': 'You',
    'HTML content pinned': 'HTML content pinned',
    'HTML content unpinned': 'HTML content unpinned',
    'Show pinned messages': 'Show pinned messages',
    
    // Page Navigation
    'Close menu': 'Close menu',
    'Open menu': 'Open menu',
    'No AI Selected': 'No AI Selected',
    'No Chat Selected': 'No Chat Selected',
    'Hi, I\'m AI ChatBot.': 'Hi, I\'m AI ChatBot.',
    'How can I help you with': 'How can I help you with',
    'How can I help you today?': 'How can I help you today?',
    'AI-generated, for reference only': 'AI-generated, for reference only',
    
    // Common UI
    'Loading...': 'Loading...',
    'Uploading': 'Uploading',
    'Cancel upload': 'Cancel upload',
    'Error': 'Error',
    'Success': 'Success',
    'Cancel': 'Cancel',
    'Confirm': 'Confirm',
    'Save': 'Save',
    'Edit': 'Edit',
    'Remove': 'Remove',
    'Add': 'Add',
    'Search': 'Search',
    'Settings': 'Settings',
    'Close': 'Close',
    'Open': 'Open',
    'Back': 'Back',
    'Next': 'Next',
    'Previous': 'Previous',
    'Finish': 'Finish',
    'Submit': 'Submit',
    'Reset': 'Reset',
    'Clear': 'Clear',
    'Select': 'Select',
    'All': 'All',
    'None': 'None',
    'Yes': 'Yes',
    'No': 'No',
    'OK': 'OK',
    
    // Toast messages
    'Wait for the previous prompt response': 'Wait for the previous prompt response',
    'Please access this tool through Moodle LTI': 'Please access this tool through Moodle LTI',
    'Failed to send message': 'Failed to send message',
    'Failed to create new chat. Please try again.': 'Failed to create new chat. Please try again.',
    'Failed to find created chat.': 'Failed to find created chat.',
    'Failed to retrieve chat after creation.': 'Failed to retrieve chat after creation.',
    'AI 响应速度较慢，建议检查网络连接': 'AI response is slow, please check your network connection',
    
    // API Error messages
    'User not authenticated': 'User not authenticated',
    'Invalid session': 'Invalid session',
    'Prompt is required': 'Prompt is required',
    'Chatflow selection is required': 'Chatflow selection is required',
    'User not found': 'User not found',
    'No course association found': 'No course association found',
    'You do not have permission to use this chatflow': 'You do not have permission to use this chatflow',
    'Chat not found': 'Chat not found',
    'Request timeout - AI service took too long to respond': 'Request timeout - AI service took too long to respond',
    'An error occurred while processing your request': 'An error occurred while processing your request',
    
    // SimpleChatflowSelector
    'Select Chatflow': 'Select Chatflow',
    'All Chatflows': 'All Chatflows',
    'No chatflows available': 'No chatflows available',
    
    // Language Toggle
    'Language': 'Language',
    'Switch to English': 'Switch to English',
    'Switch to Traditional Chinese': 'Switch to Traditional Chinese'
  }
}

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('zh') // 默認繁體中文

  // 從 localStorage 載入語言設定
  useEffect(() => {
    const savedLanguage = localStorage.getItem('chatbot-language')
    if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
      setCurrentLanguage(savedLanguage)
    }
  }, [])

  // 儲存語言設定到 localStorage
  const changeLanguage = (language) => {
    setCurrentLanguage(language)
    localStorage.setItem('chatbot-language', language)
  }

  // 翻譯函數
  const t = (key, defaultValue = key) => {
    return translations[currentLanguage]?.[key] || defaultValue
  }

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    isZh: currentLanguage === 'zh',
    isEn: currentLanguage === 'en'
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
