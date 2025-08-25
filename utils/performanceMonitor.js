/**
 * Performance Monitor Utility
 * 用于监控 AI 响应时间和性能指标
 */

class PerformanceMonitor {
    constructor() {
        this.timers = new Map();
        this.metrics = {
            apiCalls: 0,
            totalResponseTime: 0,
            averageResponseTime: 0,
            slowResponses: 0, // 超过5秒的响应
            errors: 0
        };
    }

    startTimer(id) {
        this.timers.set(id, {
            startTime: performance.now(),
            timestamp: new Date().toISOString()
        });
    }

    endTimer(id, success = true) {
        const timer = this.timers.get(id);
        if (!timer) {
            console.warn(`Timer ${id} not found`);
            return 0;
        }

        const duration = performance.now() - timer.startTime;
        this.timers.delete(id);

        // Update metrics
        this.metrics.apiCalls++;
        if (success) {
            this.metrics.totalResponseTime += duration;
            this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.apiCalls;
            
            if (duration > 5000) { // 5秒以上认为是慢响应
                this.metrics.slowResponses++;
                console.warn(`Slow AI response detected: ${duration.toFixed(2)}ms for ${id}`);
            }
        } else {
            this.metrics.errors++;
        }

        console.log(`[Performance] ${id}: ${duration.toFixed(2)}ms ${success ? '✓' : '✗'}`);
        return duration;
    }

    getMetrics() {
        return {
            ...this.metrics,
            slowResponseRate: this.metrics.apiCalls > 0 ? 
                (this.metrics.slowResponses / this.metrics.apiCalls * 100).toFixed(2) + '%' : '0%',
            errorRate: this.metrics.apiCalls > 0 ? 
                (this.metrics.errors / this.metrics.apiCalls * 100).toFixed(2) + '%' : '0%'
        };
    }

    reset() {
        this.timers.clear();
        this.metrics = {
            apiCalls: 0,
            totalResponseTime: 0,
            averageResponseTime: 0,
            slowResponses: 0,
            errors: 0
        };
    }

    logSummary() {
        const metrics = this.getMetrics();
        console.group('🔍 AI Performance Summary');
        console.log(`Total API Calls: ${metrics.apiCalls}`);
        console.log(`Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`);
        console.log(`Slow Response Rate: ${metrics.slowResponseRate}`);
        console.log(`Error Rate: ${metrics.errorRate}`);
        console.groupEnd();
    }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper function for easy use in components
export const withPerformanceTracking = async (id, asyncFunction) => {
    performanceMonitor.startTimer(id);
    try {
        const result = await asyncFunction();
        performanceMonitor.endTimer(id, true);
        return result;
    } catch (error) {
        performanceMonitor.endTimer(id, false);
        throw error;
    }
};
