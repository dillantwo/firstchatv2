import { NextResponse } from 'next/server';
import connectDB from '../../../../config/db.js';
import LTIUser from '../../../../models/LTIUser.js';
import LTICourse from '../../../../models/LTICourse.js';
import Chat from '../../../../models/Chat.js';
import ChatflowPermission from '../../../../models/ChatflowPermission.js';

// GET /api/admin/users - 获取所有用户及其使用统计
export async function GET(request) {
  try {
    // TODO: 添加管理员权限检查
    // const authResult = await checkAdminPermission(request);
    // if (authResult.error) {
    //   return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    // }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const courseId = searchParams.get('courseId') || '';
    
    // 修改逻辑：直接从LTICourse表获取用户-课程组合记录
    let courseQuery = {};
    if (courseId) {
      courseQuery.context_id = courseId;
    }

    // 获取用户-课程关联记录
    const userCourseRecords = await LTICourse.find(courseQuery)
      .populate('user_id')
      .sort({ last_access: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // 如果有用户搜索条件，需要过滤
    let filteredRecords = userCourseRecords;
    if (search) {
      filteredRecords = userCourseRecords.filter(record => {
        const user = record.user_id;
        if (!user) return false;
        return (
          user.name?.toLowerCase().includes(search.toLowerCase()) ||
          user.email?.toLowerCase().includes(search.toLowerCase()) ||
          user.username?.toLowerCase().includes(search.toLowerCase())
        );
      });
    }

    const totalRecords = await LTICourse.countDocuments(courseQuery);

    // 为每个用户-课程记录获取聊天统计
    const recordsWithStats = await Promise.all(filteredRecords.map(async (record) => {
      const user = record.user_id;
      if (!user) return null;

      const chatStats = await Chat.aggregate([
        { $match: { userId: user._id.toString() } },
        {
          $group: {
            _id: null,
            totalChats: { $sum: 1 },
            totalMessages: { $sum: { $size: '$messages' } },
            lastChatDate: { $max: '$updatedAt' }
          }
        }
      ]);

      const stats = chatStats[0] || { totalChats: 0, totalMessages: 0, lastChatDate: null };
      
      // 估算token使用量 (简单估算：每条消息平均50个token)
      const estimatedTokens = stats.totalMessages * 50;
      const estimatedCost = estimatedTokens * 0.00002; // 假设每1K token $0.02

      // 格式化用户角色（从当前课程记录获取）
      let roles = [];
      if (record.roles && record.roles.length > 0) {
        // 解析LTI角色URI
        record.roles.forEach(role => {
          const roleStr = role.toLowerCase();
          if (roleStr.includes('administrator')) {
            roles.push('Admin');
          }
          if (roleStr.includes('instructor') || roleStr.includes('teacher')) {
            roles.push('Instructor');
          }
          if (roleStr.includes('teachingassistant') || roleStr.includes('ta')) {
            roles.push('TA');
          }
          if (roleStr.includes('student') || roleStr.includes('learner')) {
            roles.push('Student');
          }
        });
      }
      
      // 使用boolean字段作为备用
      if (record.isAdmin && !roles.includes('Admin')) roles.push('Admin');
      if (record.isInstructor && !roles.includes('Instructor')) roles.push('Instructor');
      if (record.isLearner && !roles.includes('Student')) roles.push('Student');
      
      // 如果没有角色，默认为学生
      if (roles.length === 0) roles.push('Student');
      
      // 去重
      roles = [...new Set(roles)];

      return {
        // 用户基本信息
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        platform_name: user.platform_name,
        sub: user.sub,
        iss: user.iss,
        last_login: user.last_login,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        
        // 当前课程信息
        context_id: record.context_id,
        context_title: record.context_title,
        context_label: record.context_label,
        
        // 当前课程中的角色
        roles: roles,
        courseRoles: record.roles, // 原始LTI角色
        
        // 课程访问信息
        access_count: record.access_count,
        last_access: record.last_access,
        first_access: record.first_access,
        
        // 聊天统计
        stats: {
          totalChats: stats.totalChats,
          totalMessages: stats.totalMessages,
          lastChatDate: stats.lastChatDate,
          estimatedTokens,
          estimatedCost
        }
      };
    }));

    // 过滤掉null结果
    const validRecords = recordsWithStats.filter(record => record !== null);

    // 获取课程列表 - 从LTICourse表中获取
    const courseInfo = await LTICourse.aggregate([
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
        users: validRecords,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit),
          totalUsers: totalRecords,
          limit
        },
        courses: courseInfo
      }
    });

  } catch (error) {
    console.error('[Admin API] Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// DELETE /api/admin/users?userId=xxx - 删除用户及其聊天记录
export async function DELETE(request) {
  try {
    // TODO: 添加管理员权限检查
    
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // 删除用户的所有聊天记录
    await Chat.deleteMany({ userId });
    
    // 删除用户的所有课程关联
    await LTICourse.deleteMany({ user_id: userId });
    
    // 删除与该用户相关的聊天流权限
    await ChatflowPermission.deleteMany({ 
      $or: [
        { user_id: userId },
        { 'permissions.user_id': userId }
      ]
    });
    
    // 删除用户
    const deletedUser = await LTIUser.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User and associated data deleted successfully' 
    });

  } catch (error) {
    console.error('[Admin API] Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
