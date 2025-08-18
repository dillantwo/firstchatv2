// 统一的日志管理工具
// 在生产环境中可以轻松关闭调试日志

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    // 错误日志在生产环境中也需要保留
    console.error(...args);
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};

// 客户端版本（浏览器环境）
export const clientLogger = {
  log: (...args) => {
    if (typeof window !== 'undefined' && isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    if (typeof window !== 'undefined') {
      console.error(...args);
    }
  },
  
  warn: (...args) => {
    if (typeof window !== 'undefined' && isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (typeof window !== 'undefined' && isDevelopment) {
      console.info(...args);
    }
  }
};
