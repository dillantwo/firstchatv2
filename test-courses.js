// 测试课程API的去重功能
async function testCourses() {
  try {
    console.log('Testing courses API...');
    
    // 测试课程列表
    const response = await fetch('http://localhost:3001/api/admin/chatflow-permissions?action=courses');
    const data = await response.json();
    
    console.log('Response:', data);
    
    if (data.success) {
      console.log('✅ API call successful');
      console.log('📊 Number of courses returned:', data.data.length);
      console.log('📋 Course list:');
      data.data.forEach((course, index) => {
        console.log(`   ${index + 1}. ID: ${course.id}, Name: ${course.course}`);
      });
      
      // 检查是否有重复的课程ID
      const courseIds = data.data.map(c => c.id);
      const uniqueIds = [...new Set(courseIds)];
      
      if (courseIds.length === uniqueIds.length) {
        console.log('✅ No duplicate course IDs found');
      } else {
        console.log('❌ Duplicate course IDs detected!');
        console.log('Total:', courseIds.length, 'Unique:', uniqueIds.length);
      }
    } else {
      console.log('❌ API call failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error testing courses:', error.message);
  }
}

testCourses();
