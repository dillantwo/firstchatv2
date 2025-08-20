// 测试中文编码的脚本
// Test script for Chinese character encoding in exports

const testChineseEncoding = () => {
  console.log('Testing Chinese character encoding...');
  
  // 测试数据
  const testData = {
    courseName: '计算机科学基础课程',
    chatName: '关于人工智能的讨论',
    userName: '张三',
    messages: [
      { role: 'user', content: '你好，请问什么是机器学习？' },
      { role: 'assistant', content: '机器学习是人工智能的一个分支，它让计算机能够从数据中学习和改进，而不需要明确的编程指令。' }
    ]
  };
  
  // 测试JSON序列化
  console.log('JSON serialization test:');
  const jsonString = JSON.stringify(testData, null, 2);
  console.log('JSON length:', jsonString.length);
  console.log('Contains Chinese:', /[\u4e00-\u9fff]/.test(jsonString));
  
  // 测试CSV格式化
  console.log('\nCSV formatting test:');
  const csvRow = `"${testData.courseName}","${testData.chatName}","${testData.userName}"`;
  console.log('CSV row:', csvRow);
  
  // 测试BOM添加
  console.log('\nBOM test:');
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvRow;
  console.log('CSV with BOM length:', csvWithBOM.length);
  console.log('First character code:', csvWithBOM.charCodeAt(0));
  
  // 测试文件名处理
  console.log('\nFilename processing test:');
  const originalName = testData.courseName;
  const safeName = originalName.replace(/[<>:"/\\|?*]/g, '_');
  const encodedName = encodeURIComponent(originalName);
  
  console.log('Original:', originalName);
  console.log('Safe:', safeName);
  console.log('Encoded:', encodedName);
  
  return {
    jsonString,
    csvWithBOM,
    safeName,
    encodedName
  };
};

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
  window.testChineseEncoding = testChineseEncoding;
  console.log('Chinese encoding test function added to window object');
}

// 如果在Node.js环境中运行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testChineseEncoding;
}

// 直接运行测试
testChineseEncoding();
