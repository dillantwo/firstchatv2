import { NextResponse } from 'next/server';
import connectDB from '../../../../config/db.js';
import Chat from '../../../../models/Chat.js';
import LTIUser from '../../../../models/LTIUser.js';
import LTICourse from '../../../../models/LTICourse.js';
// import { checkAdminPermission } from '../../../../utils/adminAuth.js';

// GET /api/admin/chat-history - 获取聊天历史，支持多种过滤条件
export async function GET(request) {
  try {
    // 检查管理员权限 - 暂时禁用
    // const authResult = await checkAdminPermission(request);
    // if (authResult.error) {
    //   return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    // }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const courseId = searchParams.get('courseId') || '';
    const userId = searchParams.get('userId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const searchQuery = searchParams.get('search') || '';

    // 构建查询条件
    const chatQuery = {};
    
    if (userId) {
      chatQuery.userId = userId;
    }
    
    if (courseId) {
      chatQuery.courseId = courseId;
    }

    // 日期范围过滤
    if (startDate || endDate) {
      chatQuery.createdAt = {};
      if (startDate) {
        // 将开始日期转换为香港时区的开始时间 (00:00:00)
        const startDateTime = new Date(startDate + 'T00:00:00.000+08:00');
        chatQuery.createdAt.$gte = startDateTime;
      }
      if (endDate) {
        // 将结束日期转换为香港时区的结束时间 (23:59:59)
        const endDateTime = new Date(endDate + 'T23:59:59.999+08:00');
        chatQuery.createdAt.$lte = endDateTime;
      }
    }

    // 搜索聊天内容
    if (searchQuery) {
      chatQuery.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { 'messages.content': { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // 获取聊天记录总数
    const totalChats = await Chat.countDocuments(chatQuery);

    // 获取聊天记录
    const chats = await Chat.find(chatQuery)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // 获取相关用户信息
    const userIds = [...new Set(chats.map(chat => chat.userId))];
    const users = await LTIUser.find({ _id: { $in: userIds } }).lean();
    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});

    // 获取课程信息
    const courseIds = [...new Set(chats.map(chat => chat.courseId).filter(Boolean))];
    const courses = await LTICourse.find({ context_id: { $in: courseIds } }).lean();
    const courseMap = courses.reduce((acc, course) => {
      acc[course.context_id] = course;
      return acc;
    }, {});

    // 丰富聊天数据
    const enrichedChats = chats.map(chat => {
      const user = userMap[chat.userId];
      const course = courseMap[chat.courseId];
      
      return {
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
        } : null,
        messageCount: chat.messages?.length || 0,
        lastMessageAt: chat.messages?.length > 0 
          ? new Date(chat.messages[chat.messages.length - 1].timestamp).toISOString()
          : chat.updatedAt,
        estimatedTokens: chat.totalTokenUsage?.totalTokens || (chat.messages?.length || 0) * 50,
        estimatedCost: (chat.totalTokenUsage?.totalTokens || (chat.messages?.length || 0) * 50) * 0.00002
      };
    });

    // 获取统计信息
    const stats = await Chat.aggregate([
      { $match: chatQuery },
      {
        $group: {
          _id: null,
          totalChats: { $sum: 1 },
          totalMessages: { $sum: { $size: '$messages' } },
          totalTokens: { $sum: '$totalTokenUsage.totalTokens' },
          totalPromptTokens: { $sum: '$totalTokenUsage.promptTokens' },
          totalCompletionTokens: { $sum: '$totalTokenUsage.completionTokens' },
          avgMessagesPerChat: { $avg: { $size: '$messages' } }
        }
      }
    ]);

    const chatStats = stats[0] || {
      totalChats: 0,
      totalMessages: 0,
      totalTokens: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      avgMessagesPerChat: 0
    };

    // 获取所有可用的课程列表
    const allCourses = await LTICourse.aggregate([
      {
        $group: {
          _id: '$context_id',
          courseName: { $first: '$context_title' },
          userCount: { $addToSet: '$user_id' }
        }
      },
      {
        $project: {
          _id: 1,
          courseName: 1,
          userCount: { $size: '$userCount' }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        chats: enrichedChats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalChats / limit),
          totalChats,
          limit
        },
        stats: chatStats,
        courses: allCourses
      }
    });

  } catch (error) {
    console.error('[Admin API] Error fetching chat history:', error);
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
  }
}
