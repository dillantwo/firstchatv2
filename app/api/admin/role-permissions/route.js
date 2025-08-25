import { NextResponse } from 'next/server';
import connectDB from '../../../../config/db.js';
import RolePermission from '../../../../models/RolePermission.js';
import ChatflowPermission from '../../../../models/ChatflowPermission.js';
import LTIUser from '../../../../models/LTIUser.js';
import { applyRolePermissionToAllUsers } from '../../../../utils/permissionUtilsNew.mjs';

// GET /api/admin/role-permissions - 获取角色权限配置
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const action = searchParams.get('action');

    if (action === 'roles' && courseId) {
      // 获取指定课程的所有角色及其用户数量
      const rolesData = await LTIUser.aggregate([
        { $match: { context_id: courseId } },
        { $unwind: { path: '$roles', preserveNullAndEmptyArrays: true } },
        { 
          $group: { 
            _id: '$roles', 
            userCount: { $sum: 1 },
            users: { 
              $push: { 
                id: '$_id', 
                name: '$lis_person_name_full', 
                userId: '$user_id' 
              } 
            }
          } 
        },
        { $sort: { _id: 1 } }
      ]);

      const roles = rolesData.map(role => ({
        name: role._id || 'Learner', // 默认角色为学生
        userCount: role.userCount,
        users: role.users
      }));

      return NextResponse.json({
        success: true,
        data: roles
      });
    }

    if (action === 'permissions' && courseId) {
      // 获取指定课程的角色权限配置
      const permissions = await RolePermission.find({ 
        courseId,
        isActive: true 
      }).sort({ updatedAt: -1 });

      return NextResponse.json({
        success: true,
        data: permissions
      });
    }

    // 默认返回所有角色权限统计
    const stats = await RolePermission.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalRolePermissions: { $sum: 1 },
          uniqueCourses: { $addToSet: '$courseId' },
          uniqueRoles: { $addToSet: '$roleName' },
          uniqueChatflows: { $addToSet: '$chatflowId' }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats: stats[0] || {
          totalRolePermissions: 0,
          uniqueCourses: [],
          uniqueRoles: [],
          uniqueChatflows: []
        }
      }
    });

  } catch (error) {
    console.error('Role permissions GET error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// POST /api/admin/role-permissions - 更新角色权限配置
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { action, courseId, roleName, chatflowId, permissionType, hasPermission } = body;

    if (action === 'applyToUsers') {
      // 将角色权限应用到所有对应用户
      return await applyRolePermissionsToUsers(courseId, roleName, chatflowId);
    }

    if (!courseId || !roleName || !chatflowId || !permissionType) {
      return NextResponse.json({
        success: false,
        error: '缺少必需的参数'
      }, { status: 400 });
    }

    if (hasPermission) {
      // 授予角色权限
      const rolePermission = await RolePermission.grantRolePermission(
        courseId,
        roleName,
        chatflowId,
        [permissionType]
      );

      console.log(`已授予角色 ${roleName} 对聊天流 ${chatflowId} 的 ${permissionType} 权限`);

      return NextResponse.json({
        success: true,
        data: rolePermission,
        message: `成功授予角色权限`
      });
    } else {
      // 撤销角色权限
      const rolePermission = await RolePermission.revokeRolePermission(
        courseId,
        roleName,
        chatflowId
      );

      console.log(`已撤销角色 ${roleName} 对聊天流 ${chatflowId} 的权限`);

      return NextResponse.json({
        success: true,
        data: rolePermission,
        message: `成功撤销角色权限`
      });
    }

  } catch (error) {
    console.error('Role permissions POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// 将角色权限应用到所有对应用户的函数
async function applyRolePermissionsToUsers(courseId, roleName, chatflowId) {
  try {
    // 获取角色权限
    const rolePermission = await RolePermission.findOne({
      courseId,
      roleName,
      chatflowId,
      isActive: true
    });

    if (!rolePermission) {
      return NextResponse.json({
        success: false,
        error: '未找到对应的角色权限配置'
      }, { status: 404 });
    }

    // 使用工具函数应用权限
    const affectedUsers = await applyRolePermissionToAllUsers(
      courseId, 
      roleName, 
      chatflowId, 
      rolePermission.permissions
    );

    console.log(`成功为 ${affectedUsers} 个用户应用了角色 ${roleName} 的权限`);

    return NextResponse.json({
      success: true,
      affectedUsers,
      message: `成功为 ${affectedUsers} 个用户应用了权限`
    });

  } catch (error) {
    console.error('应用角色权限到用户时出错:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// DELETE /api/admin/role-permissions - 删除角色权限
export async function DELETE(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const roleName = searchParams.get('roleName');
    const chatflowId = searchParams.get('chatflowId');

    if (!courseId || !roleName || !chatflowId) {
      return NextResponse.json({
        success: false,
        error: '缺少必需的参数'
      }, { status: 400 });
    }

    // 删除角色权限
    const result = await RolePermission.findOneAndDelete({
      courseId,
      roleName,
      chatflowId
    });

    if (!result) {
      return NextResponse.json({
        success: false,
        error: '未找到要删除的角色权限'
      }, { status: 404 });
    }

    console.log(`已删除角色 ${roleName} 对聊天流 ${chatflowId} 的权限配置`);

    return NextResponse.json({
      success: true,
      message: '成功删除角色权限'
    });

  } catch (error) {
    console.error('Role permissions DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
