/**
 * AI Response Performance Test Script
 * 用于测试和分析 AI 响应性能
 */

const FLOWISE_BASE_URL = process.env.FLOWISE_BASE_URL || 'https://aiagent.qefmoodle.com';
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;

async function testFlowisePerformance(chatflowId = '1e37d433-7416-4b08-b5ee-0bd19919d335') {
    const testPrompts = [
        "Hello, how are you?",
        "What is 2+2?",
        "Tell me about AI",
        "Explain quantum physics in simple terms",
        "Write a short poem about technology"
    ];

    console.log('🚀 Starting AI Performance Test...\n');
    console.log(`Testing Flowise endpoint: ${FLOWISE_BASE_URL}`);
    console.log(`Chatflow ID: ${chatflowId}\n`);

    const results = [];

    for (let i = 0; i < testPrompts.length; i++) {
        const prompt = testPrompts[i];
        console.log(`Test ${i + 1}/5: "${prompt}"`);
        
        const startTime = Date.now();
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
            
            const response = await fetch(`${FLOWISE_BASE_URL}/api/v1/prediction/${chatflowId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(FLOWISE_API_KEY && { 'Authorization': `Bearer ${FLOWISE_API_KEY}` })
                },
                body: JSON.stringify({
                    question: prompt,
                    overrideConfig: {
                        sessionId: `test-session-${Date.now()}`
                    }
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            if (response.ok) {
                const data = await response.json();
                const responseLength = typeof data === 'string' ? data.length : JSON.stringify(data).length;
                
                results.push({
                    prompt,
                    duration,
                    success: true,
                    responseLength,
                    status: response.status
                });
                
                console.log(`✅ Success: ${duration}ms (${responseLength} chars)`);
            } else {
                results.push({
                    prompt,
                    duration,
                    success: false,
                    error: `HTTP ${response.status}`,
                    status: response.status
                });
                
                console.log(`❌ Failed: ${duration}ms (HTTP ${response.status})`);
            }
            
        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            results.push({
                prompt,
                duration,
                success: false,
                error: error.message,
                status: 'timeout'
            });
            
            console.log(`❌ Error: ${duration}ms (${error.message})`);
        }
        
        console.log(''); // 空行分隔
        
        // 避免过于频繁请求
        if (i < testPrompts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // 分析结果
    console.log('📊 Performance Analysis:');
    console.log('=' .repeat(50));
    
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    
    if (successfulResults.length > 0) {
        const durations = successfulResults.map(r => r.duration);
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const minDuration = Math.min(...durations);
        const maxDuration = Math.max(...durations);
        
        console.log(`✅ Success Rate: ${successfulResults.length}/${results.length} (${(successfulResults.length/results.length*100).toFixed(1)}%)`);
        console.log(`⏱️  Average Response Time: ${avgDuration.toFixed(0)}ms`);
        console.log(`🏃 Fastest Response: ${minDuration}ms`);
        console.log(`🐌 Slowest Response: ${maxDuration}ms`);
        
        // 性能评级
        if (avgDuration < 3000) {
            console.log('🎉 Performance Rating: Excellent (< 3s)');
        } else if (avgDuration < 8000) {
            console.log('👍 Performance Rating: Good (3-8s)');
        } else if (avgDuration < 15000) {
            console.log('⚠️  Performance Rating: Slow (8-15s)');
        } else {
            console.log('🚨 Performance Rating: Very Slow (> 15s)');
        }
    }
    
    if (failedResults.length > 0) {
        console.log(`❌ Failed Requests: ${failedResults.length}`);
        failedResults.forEach(result => {
            console.log(`   - "${result.prompt}": ${result.error}`);
        });
    }
    
    console.log('\n💡 Optimization Recommendations:');
    if (successfulResults.length > 0) {
        const avgDuration = successfulResults.map(r => r.duration).reduce((a, b) => a + b, 0) / successfulResults.length;
        
        if (avgDuration > 10000) {
            console.log('• Consider using a more powerful AI model or server');
            console.log('• Check network connectivity to Flowise server');
            console.log('• Implement request caching for common queries');
        } else if (avgDuration > 5000) {
            console.log('• Consider implementing streaming responses');
            console.log('• Add loading indicators for better user experience');
        } else {
            console.log('• Performance is good! Consider adding more advanced features');
        }
    }
    
    return results;
}

// 如果直接运行此脚本
if (require.main === module) {
    // 加载环境变量
    require('dotenv').config({ path: '.env.local' });
    
    testFlowisePerformance()
        .then(results => {
            console.log('\n✅ Performance test completed!');
        })
        .catch(error => {
            console.error('❌ Performance test failed:', error);
        });
}

module.exports = { testFlowisePerformance };
