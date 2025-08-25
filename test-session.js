import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config({ path: '.env.local' });

// 模拟检查session和权限的过程
async function testSessionAndPermission() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    console.log('=== Testing Session API Response ===');
    
    // 这里我们模拟session API会返回的用户信息
    // 实际上你需要从浏览器调用 /api/lti/session 来获取
    console.log('Call /api/lti/session from browser to see actual user context');
    console.log('Expected structure:');
    console.log('{');
    console.log('  authenticated: true,');
    console.log('  user: {');
    console.log('    id: "...",');
    console.log('    name: "...",');
    console.log('    context_id: "2" or "58",  // <-- This is the key field');
    console.log('    context_title: "...",');
    console.log('    roles: [...]');
    console.log('  }');
    console.log('}');
    
    console.log('\n=== Next Steps ===');
    console.log('1. Check what /api/lti/session returns in browser Network tab');
    console.log('2. If context_id is "58", that means you are in course 58');
    console.log('3. You need to access from course 2 context to get context_id="2"');
    console.log('4. Or add permission for course 58 using the admin interface');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testSessionAndPermission();
