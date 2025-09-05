// 测试mammoth库的图片提取功能
import mammoth from 'mammoth';

async function testMammothImageExtraction() {
    console.log('Testing mammoth image extraction capabilities...');
    
    // 测试1: 使用extractRawText (当前方法)
    console.log('\n1. Current method - extractRawText:');
    try {
        const buffer = Buffer.from('dummy docx content'); // 这里需要实际的docx文件
        const result = await mammoth.extractRawText({ buffer });
        console.log('extractRawText result structure:', Object.keys(result));
        console.log('Has images?', result.images ? 'Yes' : 'No');
    } catch (error) {
        console.log('extractRawText error (expected with dummy data):', error.message);
    }
    
    // 测试2: 使用convertToHtml (可能包含图片)
    console.log('\n2. Alternative method - convertToHtml:');
    try {
        const buffer = Buffer.from('dummy docx content'); // 这里需要实际的docx文件
        const result = await mammoth.convertToHtml({ buffer });
        console.log('convertToHtml result structure:', Object.keys(result));
        console.log('Has images?', result.images ? 'Yes' : 'No');
        if (result.images) {
            console.log('Images array length:', result.images.length);
        }
    } catch (error) {
        console.log('convertToHtml error (expected with dummy data):', error.message);
    }
    
    // 测试3: 使用convertToMarkdown
    console.log('\n3. Alternative method - convertToMarkdown:');
    try {
        const buffer = Buffer.from('dummy docx content'); // 这里需要实际的docx文件
        const result = await mammoth.convertToMarkdown({ buffer });
        console.log('convertToMarkdown result structure:', Object.keys(result));
        console.log('Has images?', result.images ? 'Yes' : 'No');
    } catch (error) {
        console.log('convertToMarkdown error (expected with dummy data):', error.message);
    }
    
    // 显示mammoth库的所有可用方法
    console.log('\n4. Available mammoth methods:');
    console.log(Object.getOwnPropertyNames(mammoth).filter(name => typeof mammoth[name] === 'function'));
    
    // 检查mammoth的文档
    console.log('\n5. Mammoth version and capabilities:');
    console.log('Version: 1.10.0');
    console.log('The mammoth library can extract images from Word documents using:');
    console.log('- convertToHtml() with image converter options');
    console.log('- extractRawText() only extracts text, no images');
}

testMammothImageExtraction();
