/**
 * Next.js Instrumentation
 * 在应用启动时初始化全局错误处理
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // 在Node.js运行时加载全局错误处理器
        await import('./utils/errorHandler.js');
        console.log('[Instrumentation] Error handlers registered');
    }
}
