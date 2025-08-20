/**
 * Chatflow Permission Management API 测试
 * 
 * 这个文件包含了测试新的chatflow permission管理功能的示例代码
 * 注意：这些测试需要在有效的数据库连接和数据的环境中运行
 */

// 测试获取所有chatflows
async function testGetChatflows() {
  try {
    const response = await fetch('/api/admin/chatflow-permissions?action=chatflows');
    const data = await response.json();
    console.log('Chatflows:', data);
    return data.success && Array.isArray(data.data);
  } catch (error) {
    console.error('Error testing chatflows:', error);
    return false;
  }
}

// 测试获取所有courses
async function testGetCourses() {
  try {
    const response = await fetch('/api/admin/chatflow-permissions?action=courses');
    const data = await response.json();
    console.log('Courses:', data);
    return data.success && Array.isArray(data.data);
  } catch (error) {
    console.error('Error testing courses:', error);
    return false;
  }
}

// 测试获取权限列表
async function testGetPermissions() {
  try {
    const response = await fetch('/api/admin/chatflow-permissions');
    const data = await response.json();
    console.log('Permissions:', data);
    return data.success && Array.isArray(data.data);
  } catch (error) {
    console.error('Error testing permissions:', error);
    return false;
  }
}

// 测试创建权限
async function testCreatePermission(chatflowId, courseId) {
  try {
    const response = await fetch('/api/admin/chatflow-permissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatflowId: chatflowId,
        courseId: courseId,
        allowedRoles: [
          'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor',
          'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'
        ],
        description: 'Test permission created via API'
      }),
    });
    
    const data = await response.json();
    console.log('Create permission result:', data);
    return data.success;
  } catch (error) {
    console.error('Error testing create permission:', error);
    return false;
  }
}

// 测试更新权限
async function testUpdatePermission(permissionId) {
  try {
    const response = await fetch('/api/admin/chatflow-permissions', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _id: permissionId,
        allowedRoles: [
          'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor'
        ],
        description: 'Updated test permission',
        isActive: true
      }),
    });
    
    const data = await response.json();
    console.log('Update permission result:', data);
    return data.success;
  } catch (error) {
    console.error('Error testing update permission:', error);
    return false;
  }
}

// 测试删除权限
async function testDeletePermission(permissionId) {
  try {
    const response = await fetch(`/api/admin/chatflow-permissions?id=${permissionId}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    console.log('Delete permission result:', data);
    return data.success;
  } catch (error) {
    console.error('Error testing delete permission:', error);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('Starting Chatflow Permission API Tests...');
  
  const results = {
    getChatflows: await testGetChatflows(),
    getCourses: await testGetCourses(),
    getPermissions: await testGetPermissions()
  };
  
  console.log('Test Results:', results);
  
  // 如果有数据，可以测试CRUD操作
  // 注意：需要替换为实际的chatflowId和courseId
  // const chatflowId = 'your-chatflow-id';
  // const courseId = 'your-course-id';
  // results.createPermission = await testCreatePermission(chatflowId, courseId);
  
  return results;
}

// 导出测试函数以便在浏览器控制台中使用
if (typeof window !== 'undefined') {
  window.chatflowPermissionTests = {
    testGetChatflows,
    testGetCourses,
    testGetPermissions,
    testCreatePermission,
    testUpdatePermission,
    testDeletePermission,
    runAllTests
  };
}

export {
  testGetChatflows,
  testGetCourses,
  testGetPermissions,
  testCreatePermission,
  testUpdatePermission,
  testDeletePermission,
  runAllTests
};
