import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');
  
  // 列出所有集合
  console.log('=== All Collections in Database ===');
  const collections = await mongoose.connection.db.listCollections().toArray();
  collections.forEach(collection => {
    console.log('Collection:', collection.name);
  });
  
  // 检查具体的LTI集合内容
  console.log('\n=== Checking LTI Collections ===');
  
  // 检查lti_users集合
  try {
    const ltiUsersCount = await mongoose.connection.db.collection('lti_users').countDocuments();
    console.log('lti_users collection documents:', ltiUsersCount);
  } catch (e) {
    console.log('lti_users collection not found or error:', e.message);
  }
  
  // 检查ltiusers集合（无下划线）
  try {
    const ltiusersCount = await mongoose.connection.db.collection('ltiusers').countDocuments();
    console.log('ltiusers collection documents:', ltiusersCount);
  } catch (e) {
    console.log('ltiusers collection not found or error:', e.message);
  }
  
  // 检查lti_courses集合
  try {
    const ltiCoursesCount = await mongoose.connection.db.collection('lti_courses').countDocuments();
    console.log('lti_courses collection documents:', ltiCoursesCount);
  } catch (e) {
    console.log('lti_courses collection not found or error:', e.message);
  }
  
  // 检查lticourses集合（无下划线）
  try {
    const lticoursesCount = await mongoose.connection.db.collection('lticourses').countDocuments();
    console.log('lticourses collection documents:', lticoursesCount);
  } catch (e) {
    console.log('lticourses collection not found or error:', e.message);
  }
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
