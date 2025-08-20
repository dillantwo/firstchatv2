import { NextResponse } from 'next/server';
import connectDB from '../../../../config/db.js';
import Chatflow from '../../../../models/Chatflow.js';
import ChatflowPermission from '../../../../models/ChatflowPermission.js';

export async function DELETE(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'cleanup-test-data') {
      // 删除测试chatflow
      const testChatflowId = 'test-direct-insert-123';
      
      const [deletedChatflow, deletedPermissions] = await Promise.all([
        Chatflow.deleteOne({ flowId: testChatflowId }),
        ChatflowPermission.deleteMany({ chatflowId: testChatflowId })
      ]);
      
      return NextResponse.json({
        success: true,
        message: 'Test data cleaned up successfully',
        deleted: {
          chatflows: deletedChatflow.deletedCount,
          permissions: deletedPermissions.deletedCount
        }
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
