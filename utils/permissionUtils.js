/**
 * 检查用户是否有访问特定chatflow的权限
 * 基于简化的角色权限模型
 * @param {string} userId - 用户ID（现在用于日志记录）
 * @param {string} courseId - 课程ID
 * @param {Array} userRoles - 用户角色数组
 * @param {string} chatflowId - 聊天流ID
 * @param {string} permissionType - 权限类型（已简化，不再使用）
 * @returns {Promise<boolean>} - 是否有权限
 */
export async function checkChatflowPermission(userId, courseId, userRoles, chatflowId, permissionType = 'chat') {
  try {
    // 动态导入模型以避免循环依赖
    const { default: ChatflowPermission } = await import('../models/ChatflowPermission.js');
    
    console.log(`[Permission Check] Checking access for user ${userId}, course ${courseId}, chatflow ${chatflowId}`);
    console.log(`[Permission Check] User roles:`, userRoles);
    
    // 检查基于角色的权限（简化版）
    const permission = await ChatflowPermission.findOne({
      courseId: courseId,
      chatflowId: chatflowId,
      allowedRoles: { $in: userRoles },
      isActive: true
    });

    if (permission) {
      console.log(`[Permission Check] User ${userId} has access to chatflow ${chatflowId} via roles:`, 
        permission.allowedRoles.filter(role => userRoles.includes(role)));
      return true;
    }

    console.log(`[Permission Check] User ${userId} has no permission for chatflow ${chatflowId}`);
    return false;
  } catch (error) {
    console.error(`[Permission Check] Error checking permission:`, error);
    return false;
  }
}

/**
 * 获取用户可访问的所有chatflow IDs
 * @param {string} userId - 用户ID
 * @param {string} courseId - 课程ID
 * @param {Array} userRoles - 用户角色数组
 * @param {string} permissionType - 权限类型 ('view', 'chat', 'edit', 'admin')
 * @returns {Promise<Array>} - 可访问的chatflow IDs数组
 */
export async function getUserAccessibleChatflows(userId, courseId, userRoles, permissionType = 'chat') {
  try {
    // 动态导入模型以避免循环依赖
    const { default: ChatflowPermission } = await import('../models/ChatflowPermission.js');
    const { default: RolePermission } = await import('../models/RolePermission.js');
    
    const accessibleChatflows = new Set();

    // 1. 获取个人权限的chatflows
    const userPermissions = await ChatflowPermission.find({
      userId,
      courseId,
      isActive: true
    });

    userPermissions.forEach(permission => {
      if (permission.permissions.includes(permissionType)) {
        accessibleChatflows.add(permission.chatflowId);
      }
    });

    // 2. 获取角色权限的chatflows
    if (userRoles && userRoles.length > 0) {
      const rolePermissions = await RolePermission.find({
        courseId,
        roleName: { $in: userRoles },
        isActive: true
      });

      rolePermissions.forEach(permission => {
        if (permission.permissions.includes(permissionType)) {
          accessibleChatflows.add(permission.chatflowId);
        }
      });
    }

    const result = Array.from(accessibleChatflows);
    console.log(`[Permission Check] User ${userId} can access ${result.length} chatflows:`, result);
    return result;
  } catch (error) {
    console.error(`[Permission Check] Error getting accessible chatflows:`, error);
    return [];
  }
}

/**
 * 为新用户自动分配角色权限
 * @param {string} userId - 用户ID
 * @param {string} courseId - 课程ID
 * @param {Array} userRoles - 用户角色数组
 * @returns {Promise<number>} - 创建的权限数量
 */
export async function autoGrantRolePermissions(userId, courseId, userRoles) {
  try {
    if (!userRoles || userRoles.length === 0) {
      return 0;
    }

    // 动态导入模型以避免循环依赖
    const { default: ChatflowPermission } = await import('../models/ChatflowPermission.js');
    const { default: RolePermission } = await import('../models/RolePermission.js');

    let createdPermissions = 0;

    // 获取用户角色对应的所有角色权限
    const rolePermissions = await RolePermission.find({
      courseId,
      roleName: { $in: userRoles },
      isActive: true,
      autoGrant: true
    });

    // 为每个角色权限创建对应的用户权限
    for (const rolePermission of rolePermissions) {
      // 检查用户是否已有该权限
      const existingPermission = await ChatflowPermission.findOne({
        userId,
        courseId,
        chatflowId: rolePermission.chatflowId
      });

      if (!existingPermission) {
        // 创建新的用户权限
        const newPermission = new ChatflowPermission({
          courseId,
          userId,
          chatflowId: rolePermission.chatflowId,
          permissions: rolePermission.permissions,
          isActive: true
        });

        await newPermission.save();
        createdPermissions++;
        console.log(`[Auto Grant] Created permission for user ${userId}, chatflow ${rolePermission.chatflowId}`);
      }
    }

    console.log(`[Auto Grant] Created ${createdPermissions} permissions for user ${userId}`);
    return createdPermissions;
  } catch (error) {
    console.error(`[Auto Grant] Error auto-granting permissions:`, error);
    return 0;
  }
}

/**
 * 批量为角色中的所有用户应用权限
 * @param {string} courseId - 课程ID
 * @param {string} roleName - 角色名称
 * @param {string} chatflowId - 聊天流ID
 * @param {Array} permissions - 权限数组
 * @returns {Promise<number>} - 受影响的用户数量
 */
export async function applyRolePermissionToAllUsers(courseId, roleName, chatflowId, permissions) {
  try {
    // 动态导入模型以避免循环依赖
    const { default: ChatflowPermission } = await import('../models/ChatflowPermission.js');
    const { default: LTIUser } = await import('../models/LTIUser.js');
    
    // 获取该课程中具有指定角色的所有用户
    const users = await LTIUser.find({
      context_id: courseId,
      roles: roleName
    });

    let affectedUsers = 0;

    for (const user of users) {
      try {
        // 检查用户是否已有该chatflow的权限
        let userPermission = await ChatflowPermission.findOne({
          courseId,
          userId: user._id,
          chatflowId
        });

        if (userPermission) {
          // 更新现有权限（合并权限）
          const mergedPermissions = [...new Set([...userPermission.permissions, ...permissions])];
          userPermission.permissions = mergedPermissions;
          userPermission.isActive = true;
          userPermission.updatedAt = new Date();
          await userPermission.save();
        } else {
          // 创建新权限
          userPermission = new ChatflowPermission({
            courseId,
            userId: user._id,
            chatflowId,
            permissions,
            isActive: true
          });
          await userPermission.save();
        }

        affectedUsers++;
      } catch (userError) {
        console.error(`[Batch Apply] Error for user ${user._id}:`, userError);
      }
    }

    console.log(`[Batch Apply] Applied role permission to ${affectedUsers} users`);
    return affectedUsers;
  } catch (error) {
    console.error(`[Batch Apply] Error applying role permissions:`, error);
    return 0;
  }
}
