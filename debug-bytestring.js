// 调试ByteString问题的工具
// Debug tool for ByteString issues

const testByteStringConversion = () => {
  console.log('Testing ByteString conversion...');
  
  // 模拟有问题的数据
  const testStrings = [
    'hello world',
    '你好世界',
    'chat_history_计算机科学_2025-08-20.csv',
    '课程名称'
  ];
  
  testStrings.forEach((str, index) => {
    console.log(`\nTest ${index + 1}: "${str}"`);
    console.log('Length:', str.length);
    
    // 检查每个字符的Unicode值
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code > 255) {
        console.log(`Character at index ${i}: "${str[i]}" has code ${code} (> 255)`);
      }
    }
    
    // 测试TextEncoder转换
    try {
      const encoder = new TextEncoder();
      const buffer = encoder.encode(str);
      console.log('TextEncoder success, buffer length:', buffer.length);
    } catch (error) {
      console.log('TextEncoder error:', error.message);
    }
    
    // 测试URL编码
    try {
      const encoded = encodeURIComponent(str);
      console.log('URL encoding success:', encoded);
    } catch (error) {
      console.log('URL encoding error:', error.message);
    }
  });
};

// 运行测试
testByteStringConversion();
