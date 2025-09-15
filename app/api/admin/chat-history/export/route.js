import { NextResponse } from 'next/server';
import connectDB from '../../../../../config/db.js';
import Chat from '../../../../../models/Chat.js';
import LTIUser from '../../../../../models/LTIUser.js';
import LTICourse from '../../../../../models/LTICourse.js';

// GET /api/admin/chat-history/export - 导出聊天历史
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const format = searchParams.get('format') || 'json'; // json, csv
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // 构建查询条件
    const chatQuery = { courseId };

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

    // 获取聊天记录
    const chats = await Chat.find(chatQuery)
      .sort({ createdAt: -1 })
      .lean();

    // 获取相关用户信息
    const userIds = [...new Set(chats.map(chat => chat.userId))];
    const users = await LTIUser.find({ _id: { $in: userIds } }).lean();
    const userMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});

    // 获取课程信息
    const course = await LTICourse.findOne({ context_id: courseId }).lean();

    // 处理数据
    const exportData = chats.map(chat => {
      const user = userMap[chat.userId];
      return {
        chatId: chat._id.toString(),
        chatName: chat.name,
        userName: user?.name || 'Unknown User',
        userEmail: user?.email || '',
        courseId: courseId,
        courseName: course?.context_title || 'Unknown Course',
        createdAt: chat.createdAt,
        lastUpdated: chat.updatedAt,
        messageCount: chat.messages?.length || 0,
        totalTokens: chat.totalTokenUsage?.totalTokens || 0,
        estimatedCost: (chat.totalTokenUsage?.totalTokens || 0) * 0.00002,
        messages: chat.messages?.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          hasImages: msg.images && msg.images.length > 0
        })) || []
      };
    });

    if (format === 'csv') {
      // 生成详细的CSV格式 - 每条消息单独一行
      const csvHeaders = [
        'Chat ID',
        'Chat Name', 
        'User Name',
        'User Email',
        'Course ID',
        'Course Name',
        'Chat Created At',
        'Chat Last Updated',
        'Message Index',
        'Message Role',
        'Message Content',
        'Message Timestamp',
        'Has Images',
        'Total Messages in Chat',
        'Total Tokens',
        'Estimated Cost'
      ];

      const csvRows = [];
      
      exportData.forEach(chat => {
        if (chat.messages && chat.messages.length > 0) {
          // 为每条消息创建一行
          chat.messages.forEach((msg, index) => {
            csvRows.push([
              chat.chatId,
              `"${chat.chatName.replace(/"/g, '""')}"`,
              `"${chat.userName.replace(/"/g, '""')}"`,
              chat.userEmail,
              chat.courseId,
              `"${chat.courseName.replace(/"/g, '""')}"`,
              chat.createdAt.toISOString(),
              chat.lastUpdated.toISOString(),
              index + 1, // 消息序号
              msg.role === 'user' ? 'User Prompt' : 'Assistant Response',
              `"${msg.content.replace(/"/g, '""')}"`,
              new Date(msg.timestamp).toISOString(),
              msg.hasImages ? 'Yes' : 'No',
              chat.messageCount,
              chat.totalTokens,
              chat.estimatedCost.toFixed(4)
            ]);
          });
        } else {
          // 如果没有消息，仍然创建一行记录聊天基本信息
          csvRows.push([
            chat.chatId,
            `"${chat.chatName.replace(/"/g, '""')}"`,
            `"${chat.userName.replace(/"/g, '""')}"`,
            chat.userEmail,
            chat.courseId,
            `"${chat.courseName.replace(/"/g, '""')}"`,
            chat.createdAt.toISOString(),
            chat.lastUpdated.toISOString(),
            0,
            'No Messages',
            'No content',
            chat.createdAt.toISOString(),
            'No',
            0,
            0,
            '0.0000'
          ]);
        }
      });

      // 添加 BOM 以确保中文正确显示
      const BOM = '\uFEFF';
      const csvContent = BOM + [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      
      const courseName = course?.context_title || 'Unknown_Course';
      // 对文件名进行更好的处理，保留中文但替换特殊字符
      const safeCourseName = courseName.replace(/[<>:"/\\|?*]/g, '_');
      const filename = `chat_history_detailed_${safeCourseName}_${new Date().toISOString().split('T')[0]}.csv`;
      
      // 对文件名进行 URL 编码以支持中文
      const encodedFilename = encodeURIComponent(filename);
      
      // 将字符串转换为UTF-8字节数组
      const csvBuffer = new TextEncoder().encode(csvContent);

      return new NextResponse(csvBuffer, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
        },
      });
    } else {
      // 生成增强的JSON格式
      const enhancedData = exportData.map(chat => ({
        chatInfo: {
          chatId: chat.chatId,
          chatName: chat.chatName,
          createdAt: chat.createdAt,
          lastUpdated: chat.lastUpdated,
          messageCount: chat.messageCount,
          totalTokens: chat.totalTokens,
          estimatedCost: chat.estimatedCost
        },
        userInfo: {
          userName: chat.userName,
          userEmail: chat.userEmail
        },
        courseInfo: {
          courseId: chat.courseId,
          courseName: chat.courseName
        },
        conversation: chat.messages?.map((msg, index) => ({
          messageIndex: index + 1,
          role: msg.role === 'user' ? 'User Prompt' : 'Assistant Response',
          content: msg.content,
          timestamp: new Date(msg.timestamp).toISOString(),
          hasImages: msg.hasImages || false,
          wordCount: msg.content.length,
          estimatedTokens: Math.ceil(msg.content.length / 4) // 粗略估算
        })) || []
      }));

      const jsonData = {
        exportInfo: {
          courseId,
          courseName: course?.context_title || 'Unknown Course',
          exportDate: new Date().toISOString(),
          totalChats: exportData.length,
          totalMessages: exportData.reduce((sum, chat) => sum + (chat.messageCount || 0), 0),
          dateRange: {
            startDate: startDate || null,
            endDate: endDate || null
          },
          description: 'Detailed chat history export with individual message breakdown'
        },
        chats: enhancedData
      };

      const courseName = course?.context_title || 'Unknown_Course';
      // 对文件名进行更好的处理，保留中文但替换特殊字符
      const safeCourseName = courseName.replace(/[<>:"/\\|?*]/g, '_');
      const filename = `chat_history_detailed_${safeCourseName}_${new Date().toISOString().split('T')[0]}.json`;
      
      // 对文件名进行 URL 编码以支持中文
      const encodedFilename = encodeURIComponent(filename);
      
      // 将JSON字符串转换为UTF-8字节数组
      const jsonBuffer = new TextEncoder().encode(JSON.stringify(jsonData, null, 2));

      return new NextResponse(jsonBuffer, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
        },
      });
    }

  } catch (error) {
    console.error('[Admin API] Error exporting chat history:', error);
    return NextResponse.json({ error: 'Failed to export chat history' }, { status: 500 });
  }
}
