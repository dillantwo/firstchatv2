/**
 * Security Validation Middleware
 * 防止命令注入、路径遍历和其他安全威胁
 */

const DANGEROUS_PATTERNS = [
    // Shell operators and command injection
    /(\||;|&&|`|\$\(|\$\{)/gi,
    
    // Dangerous commands
    /(wget|curl|nc|netcat|bash|sh\s|exec\(|eval\(|spawn\()/gi,
    
    // User management commands
    /(useradd|usermod|adduser|passwd|chpasswd|sudo|su\s)/gi,
    
    // Base64 command injection patterns - more specific to avoid false positives with data URLs
    /(base64\s+(--decode|-d)\s*\|.*sh|echo.*\|.*base64\s+(--decode|-d)|echo.*chpasswd|echo.*passwd)/gi,
    
    // Path traversal
    /(\.\.[\/\\]|\.\.%2[fF]|\.\.%5[cC])/gi,
    
    // Absolute paths to system commands
    /(\/bin\/|\/usr\/bin\/|\/sbin\/|\/usr\/sbin\/|\/dev\/)/gi,
    
    // I/O redirection
    /(>|>>|<|2>|&>)/g,
    
    // XSS patterns - exclude data URLs
    /<script[^>]*>(?!.*<\/script>.*data:)/gi,
    
    // SQL injection patterns
    /('|"|;|--|\bOR\b|\bAND\b|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b).*(\bFROM\b|\bWHERE\b|\bTABLE\b)/gi,
    
    // File path patterns that shouldn't be accessed
    /(\/etc\/passwd|\/etc\/shadow|\/proc\/|\/sys\/|\/root\/)/gi,
];

/**
 * 验证字符串是否包含危险模式
 * @param {any} value - 要检查的值
 * @param {string} fieldName - 字段名称
 * @param {boolean} isMediaContent - 是否是媒体内容（如 base64 图片/文档）
 */
export function containsDangerousPattern(value, fieldName = 'input', isMediaContent = false) {
    if (!value) return null;
    
    // Skip validation for media content (images, documents with data URLs)
    if (isMediaContent) return null;
    
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    
    // Skip if this looks like a data URL or base64 media content
    if (/^data:(image|application|text)\/[a-z0-9+-]+;base64,/i.test(valueStr)) {
        return null;
    }
    
    // Skip if this is a URL field containing a data URL
    if (valueStr.includes('data:image/') || valueStr.includes('data:application/')) {
        return null;
    }
    
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(valueStr)) {
            // Reset regex lastIndex to avoid issues with global flag
            pattern.lastIndex = 0;
            return {
                field: fieldName,
                pattern: pattern.toString(),
                value: valueStr.substring(0, 100),
                matched: true
            };
        }
    }
    
    return null;
}

/**
 * 验证文件名安全性
 */
export function isFileNameSafe(filename) {
    if (!filename) return false;
    
    // 拒绝危险文件扩展名
    const dangerousExtensions = [
        '.sh', '.bash', '.bat', '.cmd', '.exe', '.dll', '.so',
        '.php', '.jsp', '.asp', '.aspx', '.py', '.rb', '.pl'
    ];
    
    const lowerName = filename.toLowerCase();
    if (dangerousExtensions.some(ext => lowerName.endsWith(ext))) {
        return false;
    }
    
    // 拒绝路径遍历
    if (/\.\.\/|\.\.\\|\/\.\.|\\\.\./.test(filename)) {
        return false;
    }
    
    // 拒绝绝对路径
    if (/^(\/|\\|[a-zA-Z]:)/.test(filename)) {
        return false;
    }
    
    // 拒绝控制字符
    if (/[\x00-\x1f\x7f]/.test(filename)) {
        return false;
    }
    
    return true;
}

/**
 * 验证URL安全性
 */
export function isUrlSafe(url) {
    if (!url) return true;
    
    try {
        const parsedUrl = new URL(url);
        
        // 只允许 http 和 https
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return false;
        }
        
        // 阻止内网IP
        const hostname = parsedUrl.hostname;
        const privateIpPatterns = [
            /^127\./,
            /^10\./,
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
            /^192\.168\./,
            /^localhost$/i,
            /^0\.0\.0\.0$/
        ];
        
        if (privateIpPatterns.some(pattern => pattern.test(hostname))) {
            return false;
        }
        
        return true;
    } catch (e) {
        // 无效URL
        return false;
    }
}

/**
 * 记录安全事件
 */
export function logSecurityEvent(event) {
    const timestamp = new Date().toISOString();
    console.error('[🚨 SECURITY ALERT]', {
        timestamp,
        ...event
    });
    
    // 可以在这里添加其他日志记录机制
    // 例如：发送到安全监控系统、写入专门的安全日志文件等
}

/**
 * 验证请求体的所有字段
 * @param {Object} body - 请求体
 * @param {string[]} allowedFields - 允许的字段列表
 * @param {string[]} mediaFields - 媒体字段列表（跳过安全检查）
 */
export function validateRequestBody(body, allowedFields = [], mediaFields = ['images', 'documents']) {
    const results = [];
    
    for (const [key, value] of Object.entries(body)) {
        // 如果指定了允许的字段，检查是否在列表中
        if (allowedFields.length > 0 && !allowedFields.includes(key)) {
            continue; // 跳过不在白名单中的字段
        }
        
        // Skip media fields (images, documents) as they contain base64 data
        if (mediaFields.includes(key)) {
            continue;
        }
        
        const danger = containsDangerousPattern(value, key);
        if (danger) {
            results.push(danger);
        }
    }
    
    return results.length > 0 ? results : null;
}

/**
 * 清理和转义字符串
 */
export function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    // 移除控制字符
    let cleaned = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // 限制长度（防止DOS攻击）
    const MAX_LENGTH = 50000;
    if (cleaned.length > MAX_LENGTH) {
        cleaned = cleaned.substring(0, MAX_LENGTH);
    }
    
    return cleaned;
}

/**
 * 验证和清理路径
 */
export function sanitizePath(path) {
    if (!path) return null;
    
    // 移除路径遍历
    let cleaned = path.replace(/\.\.[\/\\]/g, '');
    
    // 移除绝对路径标记
    cleaned = cleaned.replace(/^[\/\\]+/, '');
    cleaned = cleaned.replace(/^[a-zA-Z]:/, '');
    
    // 规范化路径分隔符
    cleaned = cleaned.replace(/\\/g, '/');
    
    return cleaned;
}
