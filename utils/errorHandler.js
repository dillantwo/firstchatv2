/**
 * Global Error Handler
 * 防止未捕获的异常导致服务崩溃
 */

// 捕获未处理的Promise rejection
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Unhandled Rejection]', {
        reason: reason,
        promise: promise,
        timestamp: new Date().toISOString(),
        stack: reason?.stack
    });
    // 不退出进程，让服务继续运行
});

// 捕获未捕获的异常
process.on('uncaughtException', (error, origin) => {
    console.error('[Uncaught Exception]', {
        error: error.message,
        stack: error.stack,
        origin: origin,
        code: error.code,
        timestamp: new Date().toISOString()
    });
    
    // 记录具体的错误类型
    if (error.code === 'EACCES') {
        console.error('[🚨 SECURITY ATTACK BLOCKED] Path access denied:', error.path);
        // 这是攻击行为，记录后继续运行，不退出
        return;
    }
    
    // 命令执行失败也不退出
    if (error.message && error.message.includes('Command failed')) {
        console.error('[🚨 SECURITY ATTACK BLOCKED] Command execution blocked');
        return;
    }
    
    // 不退出进程，让PM2或其他进程管理器处理重启
    // 但对于严重错误，我们可能需要重启
    if (shouldRestart(error)) {
        console.error('[Critical Error] Attempting graceful shutdown...');
        gracefulShutdown();
    }
});

// 判断是否需要重启
function shouldRestart(error) {
    // 对于大多数错误，不重启
    // 只有在真正严重的系统级错误时才重启
    const criticalErrors = [
        'ENOMEM',  // 内存不足
        'ENOSPC',  // 磁盘空间不足
    ];
    
    return criticalErrors.includes(error.code);
}

// 优雅关闭
function gracefulShutdown() {
    console.log('[Shutdown] Starting graceful shutdown...');
    
    // 设置超时，如果30秒内无法优雅关闭，强制退出
    const timeout = setTimeout(() => {
        console.error('[Shutdown] Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
    
    // 清理资源
    cleanup().then(() => {
        console.log('[Shutdown] Cleanup completed');
        clearTimeout(timeout);
        process.exit(0);
    }).catch((err) => {
        console.error('[Shutdown] Cleanup failed:', err);
        clearTimeout(timeout);
        process.exit(1);
    });
}

// 清理函数
async function cleanup() {
    // 关闭数据库连接
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('[Cleanup] Database connection closed');
    }
    
    // 其他清理操作...
}

// 捕获SIGTERM和SIGINT信号
process.on('SIGTERM', () => {
    console.log('[Signal] SIGTERM received');
    gracefulShutdown();
});

process.on('SIGINT', () => {
    console.log('[Signal] SIGINT received');
    gracefulShutdown();
});

console.log('[Error Handler] Global error handlers initialized');
