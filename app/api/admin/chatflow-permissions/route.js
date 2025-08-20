import { NextResponse } from 'next/server';
import connectDB from '../../../../config/db.js';
import ChatflowPermission from '../../../../models/ChatflowPermission.js';
import Chatflow from '../../../../models/Chatflow.js';
import LTICourse from '../../../../models/LTICourse.js';

// GET /api/admin/chatflow-permissions - 获取Chatflow权限配置
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const chatflowId = searchParams.get('chatflowId');
    const action = searchParams.get('action');

    if (action === 'chatflows') {
      // 获取所有chatflows（包括非active的）
      const chatflows = await Chatflow.find({})
        .select('flowId name description category isActive')
        .sort({ name: 1 });

      return NextResponse.json({
        success: true,
        data: chatflows.map(cf => ({
          id: cf.flowId,
          name: cf.name,
          description: cf.description,
          category: cf.category,
          isActive: cf.isActive
        }))
      });
    }

    if (action === 'courses') {
      // 获取所有唯一课程（去重）
      const courses = await LTICourse.aggregate([
        { $match: { isActive: true } },
        { 
          $group: { 
            _id: '$context_id', 
            context_title: { $first: '$context_title' }
          }
        },
        { $sort: { context_title: 1 } }
      ]);

      return NextResponse.json({
        success: true,
        data: courses.map(course => ({
          id: course._id,
          course: course.context_title || course._id
        }))
      });
    }

    if (action === 'admin-overview') {
      // 管理员视图：显示所有权限记录，包括未设置权限的chatflow提示
      const [allChatflows, allPermissions, allCourses] = await Promise.all([
        Chatflow.find({}).select('flowId name description category isActive').sort({ name: 1 }),
        ChatflowPermission.find({ isActive: true }),
        LTICourse.aggregate([
          { $match: { isActive: true } },
          { 
            $group: { 
              _id: '$context_id', 
              context_title: { $first: '$context_title' }
            }
          }
        ])
      ]);

      // 创建课程映射
      const courseMap = {};
      allCourses.forEach(course => {
        courseMap[course._id] = {
          id: course._id,
          course: course.context_title || course._id
        };
      });

      // 创建chatflow映射
      const chatflowMap = {};
      allChatflows.forEach(cf => {
        chatflowMap[cf.flowId] = {
          id: cf.flowId,
          name: cf.name,
          description: cf.description,
          category: cf.category,
          isActive: cf.isActive
        };
      });

      // 返回实际的权限记录，并附加chatflow和course信息
      const enrichedPermissions = allPermissions.map(permission => ({
        _id: permission._id,
        chatflowId: permission.chatflowId,
        courseId: permission.courseId,
        allowedRoles: permission.allowedRoles,
        isActive: permission.isActive,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
        chatflow: chatflowMap[permission.chatflowId] || { 
          id: permission.chatflowId, 
          name: 'Unknown Chatflow',
          isActive: false 
        },
        course: courseMap[permission.courseId] || { 
          id: permission.courseId, 
          course: 'Unknown Course' 
        }
      }));

      return NextResponse.json({
        success: true,
        data: enrichedPermissions,
        meta: {
          totalChatflows: allChatflows.length,
          activeChatflows: allChatflows.filter(cf => cf.isActive).length,
          totalPermissions: allPermissions.length
        }
      });
    }

    // 构建查询条件
    let query = { isActive: true };
    if (courseId) query.courseId = courseId;
    if (chatflowId) query.chatflowId = chatflowId;

    // 获取权限配置，并关联chatflow和course信息
    const permissions = await ChatflowPermission.find(query)
      .sort({ updatedAt: -1 });

    // 获取相关的chatflow和course信息以便显示
    const chatflowIds = [...new Set(permissions.map(p => p.chatflowId))];
    const courseIds = [...new Set(permissions.map(p => p.courseId))];

    const [chatflows, courses] = await Promise.all([
      Chatflow.find({ flowId: { $in: chatflowIds } })
        .select('flowId name description category isActive'),
      LTICourse.aggregate([
        { $match: { context_id: { $in: courseIds }, isActive: true } },
        { 
          $group: { 
            _id: '$context_id', 
            context_title: { $first: '$context_title' }
          }
        }
      ])
    ]);

    // 创建映射以便快速查找
    const chatflowMap = {};
    chatflows.forEach(cf => {
      chatflowMap[cf.flowId] = {
        id: cf.flowId,
        name: cf.name,
        description: cf.description,
        category: cf.category,
        isActive: cf.isActive
      };
    });

    const courseMap = {};
    courses.forEach(course => {
      courseMap[course._id] = {
        id: course._id,
        course: course.context_title || course._id
      };
    });

    // 整合数据
    const enrichedPermissions = permissions.map(permission => ({
      _id: permission._id,
      chatflowId: permission.chatflowId,
      courseId: permission.courseId,
      allowedRoles: permission.allowedRoles,
      isActive: permission.isActive,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
      chatflow: chatflowMap[permission.chatflowId] || { 
        id: permission.chatflowId, 
        name: 'Unknown Chatflow' 
      },
      course: courseMap[permission.courseId] || { 
        id: permission.courseId, 
        course: 'Unknown Course' 
      }
    }));

    return NextResponse.json({
      success: true,
      data: enrichedPermissions
    });

  } catch (error) {
    console.error('Chatflow permissions GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST /api/admin/chatflow-permissions - 创建或更新Chatflow权限配置
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { chatflowId, courseId, allowedRoles } = body;

    // 验证必填字段
    if (!chatflowId || !courseId || !allowedRoles || !Array.isArray(allowedRoles)) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: chatflowId, courseId, allowedRoles'
      }, { status: 400 });
    }

    // 检查是否已存在相同的权限配置
    const existingPermission = await ChatflowPermission.findOne({
      chatflowId,
      courseId
    });

    let permission;
    if (existingPermission) {
      // 更新现有权限
      permission = await ChatflowPermission.findByIdAndUpdate(
        existingPermission._id,
        {
          allowedRoles,
          isActive: true,
          updatedAt: new Date()
        },
        { new: true }
      );
    } else {
      // 创建新权限
      permission = new ChatflowPermission({
        chatflowId,
        courseId,
        allowedRoles,
        isActive: true
      });
      await permission.save();
    }

    return NextResponse.json({
      success: true,
      data: permission,
      message: existingPermission ? 'Permission updated successfully' : 'Permission created successfully'
    });

  } catch (error) {
    console.error('Chatflow permissions POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// PUT /api/admin/chatflow-permissions - 更新权限配置
export async function PUT(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { _id, allowedRoles, isActive } = body;

    if (!_id) {
      return NextResponse.json({
        success: false,
        error: 'Permission ID is required'
      }, { status: 400 });
    }

    const permission = await ChatflowPermission.findByIdAndUpdate(
      _id,
      {
        ...(allowedRoles && { allowedRoles }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!permission) {
      return NextResponse.json({
        success: false,
        error: 'Permission not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: permission,
      message: 'Permission updated successfully'
    });

  } catch (error) {
    console.error('Chatflow permissions PUT error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE /api/admin/chatflow-permissions - 删除权限配置
export async function DELETE(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get('id');

    if (!permissionId) {
      return NextResponse.json({
        success: false,
        error: 'Permission ID is required'
      }, { status: 400 });
    }

    const permission = await ChatflowPermission.findByIdAndUpdate(
      permissionId,
      { 
        isActive: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!permission) {
      return NextResponse.json({
        success: false,
        error: 'Permission not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Permission deleted successfully'
    });

  } catch (error) {
    console.error('Chatflow permissions DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
