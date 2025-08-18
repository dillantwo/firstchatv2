import { NextResponse } from 'next/server';
import connectDB from '../../../../../config/db.js';
import Chat from '../../../../../models/Chat.js';
import LTIUser from '../../../../../models/LTIUser.js';
import LTICourse from '../../../../../models/LTICourse.js';

// GET /api/admin/chat-history/[chatId] - 获取特定聊天的详细内容
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { chatId } = await params;

    const chat = await Chat.findById(chatId).lean();    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // 获取用户信息
    const user = await LTIUser.findById(chat.userId).lean();
    
    // 获取课程信息
    let course = null;
    if (chat.courseId) {
      course = await LTICourse.findOne({ context_id: chat.courseId }).lean();
    }

    const enrichedChat = {
      ...chat,
      user: user ? {
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username
      } : null,
      course: course ? {
        context_id: course.context_id,
        context_title: course.context_title,
        context_label: course.context_label
      } : null
    };

    return NextResponse.json({
      success: true,
      data: { chat: enrichedChat }
    });

  } catch (error) {
    console.error('[Admin API] Error fetching chat details:', error);
    return NextResponse.json({ error: 'Failed to fetch chat details' }, { status: 500 });
  }
}
