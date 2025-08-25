/**
 * Permission utility functions for chatflow access control
 */

/**
 * Check if user has permission to access a specific chatflow
 * Based on role-based ChatflowPermission model
 * @param {string} userId - User ID (for logging)
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
    
    console.log('[Permission Check] Checking permission for:', {
      userId,
      courseId,
      userRoles,
      chatflowId
    });
    
    // Check role-based permissions using ChatflowPermission model
    // This matches the logic in /api/chatflows
    const permission = await ChatflowPermission.findOne({
      courseId: courseId,
      chatflowId: chatflowId,
      allowedRoles: { $in: userRoles },
      isActive: true
    });
    
    const hasPermission = !!permission;
    
    console.log('[Permission Check] Permission found:', hasPermission);
    
    return hasPermission;
  } catch (error) {
    console.error('[Permission Check] Error checking permission:', error);
    // Default to denying access on error for security
    return false;
  }
}

/**
 * Get list of accessible chatflows for user
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @param {Array} userRoles - User roles array
 * @param {string} permissionType - Permission type (deprecated)
 * @returns {Promise<Array>} - Array of accessible chatflow IDs
 */
export async function getUserAccessibleChatflows(userId, courseId, userRoles, permissionType = 'chat') {
  try {
    // Dynamically import models to avoid circular dependency
    const { default: ChatflowPermission } = await import('../models/ChatflowPermission.js');
    
    console.log('[Get Accessible Chatflows] Checking for:', {
      userId,
      courseId,
      userRoles
    });
    
    // Get all chatflow permissions for this course and user roles
    const permissions = await ChatflowPermission.find({
      courseId: courseId,
      allowedRoles: { $in: userRoles },
      isActive: true
    });
    
    const accessibleChatflows = permissions.map(p => p.chatflowId);
    
    console.log('[Get Accessible Chatflows] Found chatflows:', accessibleChatflows);
    
    return accessibleChatflows;
  } catch (error) {
    console.error('[Get Accessible Chatflows] Error:', error);
    return [];
  }
}

/**
 * Auto-grant permissions based on role permissions
 * NOTE: This function is deprecated in the new role-based permission model
 * Permissions are now granted directly through ChatflowPermission with allowedRoles
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @param {Array} userRoles - User roles array
 * @returns {Promise<number>} - Always returns 0 (deprecated)
 */
export async function autoGrantRolePermissions(userId, courseId, userRoles) {
  console.log('[Auto Grant] Function deprecated - using role-based permissions');
  return 0;
}

/**
 * Batch apply permissions to all users in a role
 * NOTE: This function is deprecated in the new role-based permission model
 * Use setChatflowRolePermission instead
 * @param {string} courseId - Course ID
 * @param {string} roleName - Role name
 * @param {string} chatflowId - Chatflow ID
 * @param {Array} permissions - Permissions array
 * @returns {Promise<number>} - Always returns 0 (deprecated)
 */
export async function applyRolePermissionToAllUsers(courseId, roleName, chatflowId, permissions) {
  console.log('[Apply Role Permission] Function deprecated - use setChatflowRolePermission instead');
  return 0;
}

/**
 * Set or update chatflow permission for specific roles in a course
 * This is the new recommended way to manage permissions
 * @param {string} courseId - Course ID
 * @param {string} chatflowId - Chatflow ID
 * @param {Array} allowedRoles - Array of role names that should have access
 * @param {string} description - Optional description
 * @returns {Promise<Object>} - Result object with success status
 */
export async function setChatflowRolePermission(courseId, chatflowId, allowedRoles, description = '') {
  try {
    // Dynamically import model to avoid circular dependency
    const { default: ChatflowPermission } = await import('../models/ChatflowPermission.js');
    
    console.log('[Set Chatflow Permission] Setting permission:', {
      courseId,
      chatflowId,
      allowedRoles,
      description
    });
    
    // Check if permission already exists
    let permission = await ChatflowPermission.findOne({
      courseId,
      chatflowId
    });
    
    if (permission) {
      // Update existing permission
      permission.allowedRoles = allowedRoles;
      permission.description = description;
      permission.isActive = true;
      permission.updatedAt = new Date();
      await permission.save();
      
      console.log('[Set Chatflow Permission] Updated existing permission');
      return { success: true, action: 'updated', permission };
    } else {
      // Create new permission
      permission = new ChatflowPermission({
        courseId,
        chatflowId,
        allowedRoles,
        description,
        isActive: true
      });
      await permission.save();
      
      console.log('[Set Chatflow Permission] Created new permission');
      return { success: true, action: 'created', permission };
    }
  } catch (error) {
    console.error('[Set Chatflow Permission] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove chatflow permission for a course
 * @param {string} courseId - Course ID
 * @param {string} chatflowId - Chatflow ID
 * @returns {Promise<Object>} - Result object with success status
 */
export async function removeChatflowPermission(courseId, chatflowId) {
  try {
    // Dynamically import model to avoid circular dependency
    const { default: ChatflowPermission } = await import('../models/ChatflowPermission.js');
    
    console.log('[Remove Chatflow Permission] Removing permission:', {
      courseId,
      chatflowId
    });
    
    const result = await ChatflowPermission.deleteOne({
      courseId,
      chatflowId
    });
    
    if (result.deletedCount > 0) {
      console.log('[Remove Chatflow Permission] Permission removed successfully');
      return { success: true, action: 'deleted' };
    } else {
      console.log('[Remove Chatflow Permission] No permission found to delete');
      return { success: false, message: 'Permission not found' };
    }
  } catch (error) {
    console.error('[Remove Chatflow Permission] Error:', error);
    return { success: false, error: error.message };
  }
}
