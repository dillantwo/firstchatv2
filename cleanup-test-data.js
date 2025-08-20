import connectDB from './config/db.js';
import Chatflow from './models/Chatflow.js';
import ChatflowPermission from './models/ChatflowPermission.js';

async function cleanupTestData() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');
    
    // 删除测试chatflow
    const testChatflowId = 'test-direct-insert-123';
    
    console.log('Deleting test chatflow...');
    const deletedChatflow = await Chatflow.deleteOne({ flowId: testChatflowId });
    console.log('Deleted chatflow:', deletedChatflow.deletedCount);
    
    console.log('Deleting related permissions...');
    const deletedPermissions = await ChatflowPermission.deleteMany({ chatflowId: testChatflowId });
    console.log('Deleted permissions:', deletedPermissions.deletedCount);
    
    console.log('Cleanup completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupTestData();
