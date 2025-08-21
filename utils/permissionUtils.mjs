/**
 * Permission utility functions for chatflow access control
 */

/**
 * Check if user has permission to access a specific chatflow
 * Based on simplified role permission model
 * @param {string} userId - User ID (now used for logging)
 * @param {string} courseId - Course ID
 * @param {Array} userRoles - User roles array
 * @param {string} chatflowId - Chatflow ID
 * @param {string} permissionType - Permission type (simplified, no longer used)
 * @returns {Promise<boolean>} - Whether has permission
 */
export async function checkChatflowPermission(userId, courseId, userRoles, chatflowId, permissionType = 'chat') {
  try {
    // Dynamically import model to avoid circular dependency
    const { default: ChatflowPermission } = await import('../models/ChatflowPermission.js');
    
    console.log(`[Permission Check] Checking permission for user ${userId} in course ${courseId} for chatflow ${chatflowId}`);
    console.log(`[Permission Check] User roles:`, userRoles);
    
    // Check role-based permissions (simplified version)
    // For teachers and admin roles, grant access by default
    const privilegedRoles = ['Instructor', 'TeachingAssistant', 'Administrator', 'ContentDeveloper'];
    const hasPrivilegedRole = userRoles?.some(role => 
      privilegedRoles.includes(role) || role.toLowerCase().includes('teacher') || role.toLowerCase().includes('admin')
    );
    
    if (hasPrivilegedRole) {
      console.log(`[Permission Check] User has privileged role, access granted`);
      return true;
    }
    
    // For students and other roles, check explicit permissions
    const userPermission = await ChatflowPermission.findOne({
      courseId,
      userId,
      chatflowId,
      isActive: true
    });
    
    const hasPermission = userPermission && userPermission.permissions.includes(permissionType);
    console.log(`[Permission Check] Explicit permission found:`, !!userPermission, `Has ${permissionType} permission:`, hasPermission);
    
    return hasPermission;
  } catch (error) {
    console.error(`[Permission Check] Error checking permission:`, error);
    // Default to allowing access on error to prevent service disruption
    return true;
  }
}

/**
 * Get list of accessible chatflows for user
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @param {Array} userRoles - User roles array
 * @param {string} permissionType - Permission type
 * @returns {Promise<Array>} - Array of accessible chatflow IDs
 */
export async function getUserAccessibleChatflows(userId, courseId, userRoles, permissionType = 'chat') {
  try {
    // Dynamically import models to avoid circular dependency
    const { default: ChatflowPermission } = await import('../models/ChatflowPermission.js');
    const { default: RolePermission } = await import('../models/RolePermission.js');
    
    console.log(`[Access Check] Getting accessible chatflows for user ${userId} in course ${courseId}`);
    
    // For privileged roles, get all chatflows from role permissions
    const privilegedRoles = ['Instructor', 'TeachingAssistant', 'Administrator', 'ContentDeveloper'];
    const hasPrivilegedRole = userRoles?.some(role => 
      privilegedRoles.includes(role) || role.toLowerCase().includes('teacher') || role.toLowerCase().includes('admin')
    );
    
    if (hasPrivilegedRole) {
      // Get all chatflows available to privileged roles in this course
      const rolePermissions = await RolePermission.find({
        courseId,
        roleName: { $in: userRoles },
        isActive: true
      });
      
      const accessibleChatflows = [...new Set(rolePermissions.map(rp => rp.chatflowId))];
      console.log(`[Access Check] Privileged user, accessible chatflows:`, accessibleChatflows);
      return accessibleChatflows;
    }
    
    // For regular users, check explicit permissions
    const userPermissions = await ChatflowPermission.find({
      courseId,
      userId,
      isActive: true,
      permissions: permissionType
    });
    
    const accessibleChatflows = userPermissions.map(p => p.chatflowId);
    console.log(`[Access Check] Regular user, accessible chatflows:`, accessibleChatflows);
    return accessibleChatflows;
  } catch (error) {
    console.error(`[Access Check] Error getting accessible chatflows:`, error);
    return [];
  }
}

/**
 * Auto-grant permissions based on role permissions
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @param {Array} userRoles - User roles array
 * @returns {Promise<number>} - Number of permissions created
 */
export async function autoGrantRolePermissions(userId, courseId, userRoles) {
  try {
    console.log(`[Auto Grant] Auto-granting permissions for user ${userId} with roles:`, userRoles);
    
    // For privileged roles, skip auto-grant as they have access by default
    const privilegedRoles = ['Instructor', 'TeachingAssistant', 'Administrator', 'ContentDeveloper'];
    const hasPrivilegedRole = userRoles?.some(role => 
      privilegedRoles.includes(role) || role.toLowerCase().includes('teacher') || role.toLowerCase().includes('admin')
    );
    
    if (hasPrivilegedRole) {
      console.log(`[Auto Grant] User has privileged role, skipping auto-grant`);
      return 0;
    }
    
    // Dynamically import model to avoid circular dependency
    const { default: ChatflowPermission } = await import('../models/ChatflowPermission.js');
    const { default: RolePermission } = await import('../models/RolePermission.js');
    
    // Find role permissions for user's roles in this course
    const rolePermissions = await RolePermission.find({
      courseId,
      roleName: { $in: userRoles },
      isActive: true,
      autoGrant: true
    });
    
    let createdPermissions = 0;
    
    for (const rolePermission of rolePermissions) {
      // Check if user already has this permission
      const existingPermission = await ChatflowPermission.findOne({
        courseId,
        userId,
        chatflowId: rolePermission.chatflowId
      });
      
      if (!existingPermission) {
        // Create new permission
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
 * Batch apply permissions to all users in a role
 * @param {string} courseId - Course ID
 * @param {string} roleName - Role name
 * @param {string} chatflowId - Chatflow ID
 * @param {Array} permissions - Permissions array
 * @returns {Promise<number>} - Number of affected users
 */
export async function applyRolePermissionToAllUsers(courseId, roleName, chatflowId, permissions) {
  try {
    // Dynamically import model to avoid circular dependency
    const { default: ChatflowPermission } = await import('../models/ChatflowPermission.js');
    const { default: LTIUser } = await import('../models/LTIUser.js');
    
    // Get all users with specified role in the course
    const users = await LTIUser.find({
      context_id: courseId,
      roles: roleName
    });

    let affectedUsers = 0;

    for (const user of users) {
      try {
        // Check if user already has permission for this chatflow
        let userPermission = await ChatflowPermission.findOne({
          courseId,
          userId: user._id,
          chatflowId
        });

        if (userPermission) {
          // Update existing permission (merge permissions)
          const mergedPermissions = [...new Set([...userPermission.permissions, ...permissions])];
          userPermission.permissions = mergedPermissions;
          userPermission.isActive = true;
          userPermission.updatedAt = new Date();
          await userPermission.save();
        } else {
          // Create new permission
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
