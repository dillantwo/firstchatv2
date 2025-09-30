// Server-side translations for API routes
// This file provides translation functions for use in API routes and server-side code

const translations = {
  zh: {
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
  },
  en: {
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
  }
}

/**
 * Get translation for a given key and language
 * @param {string} key - The translation key
 * @param {string} language - The language code ('zh' or 'en')
 * @param {string} defaultValue - Default value if translation not found
 * @returns {string} - Translated text
 */
export function getTranslation(key, language = 'zh', defaultValue = key) {
  return translations[language]?.[key] || defaultValue
}

/**
 * Get language preference from request headers
 * NOTE: This is only used for API error messages, NOT for AI responses
 * AI responses should be determined by the system prompt and input content language
 * @param {Request} req - The request object
 * @returns {string} - Language code ('zh' or 'en')
 */
export function getLanguageFromRequest(req) {
  // Try to get language from Accept-Language header
  const acceptLanguage = req.headers.get('accept-language') || ''
  
  // Check for English variants first (more explicit check)
  if (acceptLanguage.includes('en') || acceptLanguage.includes('english')) {
    return 'en'
  }
  
  // Check for Chinese variants
  if (acceptLanguage.includes('zh') || acceptLanguage.includes('chinese')) {
    return 'zh'
  }
  
  // Default to Chinese if no preference detected
  return 'zh'
}

/**
 * Create a translation function for a specific language
 * @param {string} language - The language code
 * @returns {function} - Translation function
 */
export function createTranslator(language = 'zh') {
  return (key, defaultValue = key) => getTranslation(key, language, defaultValue)
}
