/**
 * Next.js Instrumentation
 * 在应用启动时初始化全局错误处理
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // 首先禁用child_process以防止命令执行
        try {
            const Module = require('module');
            const originalRequire = Module.prototype.require;
            
            Module.prototype.require = function(id) {
                if (id === 'child_process') {
                    console.error('[🚨 SECURITY] child_process access blocked!');
                    return {
                        exec: () => { throw new Error('BLOCKED: child_process disabled'); },
                        execSync: () => { throw new Error('BLOCKED: child_process disabled'); },
                        spawn: () => { throw new Error('BLOCKED: child_process disabled'); },
                        spawnSync: () => { throw new Error('BLOCKED: child_process disabled'); },
                        execFile: () => { throw new Error('BLOCKED: child_process disabled'); },
                        execFileSync: () => { throw new Error('BLOCKED: child_process disabled'); },
                        fork: () => { throw new Error('BLOCKED: child_process disabled'); },
                    };
                }
                return originalRequire.apply(this, arguments);
            };
            console.log('[Security] child_process module blocked');
        } catch (e) {
            console.error('[Security] Failed to block child_process:', e.message);
        }
        
        // 加载全局错误处理器
        await import('./utils/errorHandler.js');
        console.log('[Instrumentation] Security measures active');
    }
}
