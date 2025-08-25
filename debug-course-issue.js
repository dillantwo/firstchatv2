import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LTIUser from './models/LTIUser.js';
import LTICourse from './models/LTICourse.js';

dotenv.config({ path: '.env.local' });

async function checkUserCourseAssociations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // 查找用户 (从日志中的userId)
    const userId = '689ef79e7c7e0bf29aa05ced'; // 从验证脚本看到的实际用户ID
    const user = await LTIUser.findById(userId);
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('=== User Information ===');
    console.log('User ID:', user._id);
    console.log('User Name:', user.name);
    console.log('User Sub:', user.sub);
    
    console.log('\n=== All Course Associations ===');
    const allCourses = await LTICourse.find({ user_id: user._id }).sort({ updatedAt: -1 });
    
    allCourses.forEach((course, index) => {
      console.log(`${index + 1}. Course ID: ${course.context_id}`);
      console.log(`   Title: ${course.context_title}`);
      console.log(`   Roles: ${course.roles.join(', ')}`);
      console.log(`   Last Access: ${course.last_access}`);
      console.log(`   Updated At: ${course.updatedAt}`);
      console.log(`   Access Count: ${course.access_count}`);
      console.log('');
    });
    
    console.log('=== Current Logic Result ===');
    const currentLogicResult = await LTICourse.findOne({ 
      user_id: user._id 
    }).sort({ updatedAt: -1 });
    
    console.log('Current logic selects course:', currentLogicResult.context_id);
    console.log('But user expects course: 2');
    
    console.log('\n=== Suggested Fix ===');
    console.log('Problem: Using .sort({ updatedAt: -1 }) gets the most recently updated course,');
    console.log('not necessarily the current course the user is in.');
    console.log('');
    console.log('Solutions:');
    console.log('1. Use last_access instead of updatedAt');
    console.log('2. Use session-based course context');
    console.log('3. Pass courseId from frontend');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkUserCourseAssociations();
