import { NextResponse } from 'next/server';
import connectDB from '../../../../config/db.js';
import Chat from '../../../../models/Chat.js';
import LTIUser from '../../../../models/LTIUser.js';

// GET /api/admin/analytics - 获取使用分析数据
export async function GET(request) {
  try {
    // TODO: 添加管理员权限检查
    
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d'; // 7d, 30d, 90d, 1y
    const courseId = searchParams.get('courseId') || '';
    
    // 计算时间范围
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // 构建聊天查询条件
    const chatQuery = {
      updatedAt: { $gte: startDate }
    };

    // 如果指定了课程，需要先获取该课程的用户ID
    let userIds = [];
    if (courseId) {
      const users = await LTIUser.find({ context_id: courseId }).select('_id');
      userIds = users.map(user => user._id.toString());
      chatQuery.userId = { $in: userIds };
    }

    // 总体统计
    const totalStats = await Promise.all([
      // 活跃用户数
      Chat.distinct('userId', chatQuery),
      // 总聊天数
      Chat.countDocuments(chatQuery),
      // 总消息数
      Chat.aggregate([
        { $match: chatQuery },
        { $project: { messageCount: { $size: '$messages' } } },
        { $group: { _id: null, total: { $sum: '$messageCount' } } }
      ]),
      // 按chatflow统计
      Chat.aggregate([
        { $match: chatQuery },
        { $group: { _id: '$chatflowId', chatCount: { $sum: 1 }, messageCount: { $sum: { $size: '$messages' } } } }
      ])
    ]);

    const activeUsers = totalStats[0].length;
    const totalChats = totalStats[1];
    const totalMessages = totalStats[2][0]?.total || 0;
    const chatflowStats = totalStats[3];

    // 每日使用趋势
    const dailyUsage = await Chat.aggregate([
      { $match: chatQuery },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' },
            day: { $dayOfMonth: '$updatedAt' }
          },
          chatCount: { $sum: 1 },
          messageCount: { $sum: { $size: '$messages' } },
          userCount: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          },
          chatCount: 1,
          messageCount: 1,
          userCount: { $size: '$userCount' }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // 用户活跃度分布
    const userActivity = await Chat.aggregate([
      { $match: chatQuery },
      {
        $group: {
          _id: '$userId',
          chatCount: { $sum: 1 },
          messageCount: { $sum: { $size: '$messages' } },
          lastActivity: { $max: '$updatedAt' }
        }
      },
      {
        $bucket: {
          groupBy: '$chatCount',
          boundaries: [1, 5, 10, 20, 50, 100],
          default: '100+',
          output: {
            userCount: { $sum: 1 },
            avgMessages: { $avg: '$messageCount' }
          }
        }
      }
    ]);

    // 热门时段分析
    const hourlyUsage = await Chat.aggregate([
      { $match: chatQuery },
      {
        $group: {
          _id: { $hour: '$updatedAt' },
          chatCount: { $sum: 1 },
          messageCount: { $sum: { $size: '$messages' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 课程使用统计
    const courseStats = await Chat.aggregate([
      { $match: chatQuery },
      {
        $lookup: {
          from: 'ltiusers',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $group: {
          _id: '$user.context_id',
          courseName: { $first: '$user.context_title' },
          chatCount: { $sum: 1 },
          messageCount: { $sum: { $size: '$messages' } },
          userCount: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          courseId: '$_id',
          courseName: 1,
          chatCount: 1,
          messageCount: 1,
          userCount: { $size: '$userCount' }
        }
      },
      { $sort: { chatCount: -1 } }
    ]);

    // 估算token使用和成本
    const estimatedTokens = totalMessages * 50; // 每条消息平均50个token
    const estimatedCost = estimatedTokens * 0.00002; // 每1K token $0.02

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          activeUsers,
          totalChats,
          totalMessages,
          estimatedTokens,
          estimatedCost,
          timeRange,
          startDate,
          endDate: now
        },
        dailyUsage,
        userActivity,
        hourlyUsage,
        chatflowStats,
        courseStats
      }
    });

  } catch (error) {
    console.error('[Admin API] Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
