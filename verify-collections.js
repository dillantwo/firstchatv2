import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LTIUser from './models/LTIUser.js';
import LTICourse from './models/LTICourse.js';

dotenv.config({ path: '.env.local' });

async function verifyCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    console.log('=== Collection Verification ===');
    
    // 检查所有集合
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nAll collections:');
    collections.forEach(c => console.log(`  - ${c.name}`));
    
    // 验证LTI集合状态
    console.log('\n=== LTI Collections Status ===');
    
    // 使用正确的模型查询数据
    const userCount = await LTIUser.countDocuments();
    const courseCount = await LTICourse.countDocuments();
    
    console.log(`lti_users: ${userCount} users`);
    console.log(`lti_courses: ${courseCount} course associations`);
    
    // 检查是否还有错误的集合存在
    const ltiCollections = collections.filter(c => c.name.toLowerCase().includes('lti'));
    console.log('\nLTI-related collections:');
    ltiCollections.forEach(c => {
      const isCorrect = ['lti_users', 'lti_courses', 'lti_users_new'].includes(c.name);
      console.log(`  ${isCorrect ? '✅' : '❌'} ${c.name}`);
    });
    
    if (userCount > 0) {
      console.log('\n=== Sample User Data ===');
      const sampleUser = await LTIUser.findOne();
      console.log('Sample user:', {
        id: sampleUser._id,
        name: sampleUser.name,
        sub: sampleUser.sub
      });
      
      console.log('\n=== User Course Associations ===');
      const userCourses = await LTICourse.find({ user_id: sampleUser._id });
      userCourses.forEach(course => {
        console.log(`Course: ${course.context_id} (${course.context_title})`);
        console.log(`  Roles: ${course.roles.join(', ')}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

verifyCollections();
