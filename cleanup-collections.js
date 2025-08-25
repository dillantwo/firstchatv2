import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function cleanupDuplicateCollections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    console.log('=== Cleaning up duplicate collections ===');
    
    // 检查并删除空的重复集合
    const collectionsToCheck = [
      { wrong: 'ltiusers', correct: 'lti_users' },
      { wrong: 'lticourses', correct: 'lti_courses' }
    ];
    
    for (const { wrong, correct } of collectionsToCheck) {
      try {
        // 检查错误集合的文档数量
        const wrongCount = await mongoose.connection.db.collection(wrong).countDocuments();
        const correctCount = await mongoose.connection.db.collection(correct).countDocuments();
        
        console.log(`\n--- ${wrong} vs ${correct} ---`);
        console.log(`${wrong}: ${wrongCount} documents`);
        console.log(`${correct}: ${correctCount} documents`);
        
        if (wrongCount === 0 && correctCount > 0) {
          // 如果错误的集合是空的，而正确的集合有数据，则删除错误的集合
          console.log(`Dropping empty collection: ${wrong}`);
          await mongoose.connection.db.collection(wrong).drop();
          console.log(`✅ Successfully dropped ${wrong}`);
        } else if (wrongCount > 0) {
          console.log(`⚠️  Warning: ${wrong} is not empty, manual review needed`);
          
          // 显示一些示例文档
          const sampleDocs = await mongoose.connection.db.collection(wrong).find({}).limit(3).toArray();
          console.log('Sample documents:', sampleDocs);
        } else {
          console.log(`ℹ️  ${wrong} collection not found or already empty`);
        }
      } catch (error) {
        if (error.message.includes('ns not found')) {
          console.log(`ℹ️  Collection ${wrong} does not exist`);
        } else {
          console.error(`Error processing ${wrong}:`, error.message);
        }
      }
    }
    
    console.log('\n=== Final collection status ===');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const ltiCollections = collections.filter(c => c.name.toLowerCase().includes('lti'));
    ltiCollections.forEach(collection => {
      console.log('LTI Collection:', collection.name);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

cleanupDuplicateCollections();
