import jwt from 'jsonwebtoken';
import connectDB from '../config/db.js';
import AdminPermission from '../models/AdminPermission.js';
import LTIUser from '../models/LTIUser.js';

/**
 * Check if user has admin permission
 * @param {string} requiredPermission - Required permission
 * @returns {Function} Middleware function
 */
export function checkAdminPermission(requiredPermission) {
  return async (req, res, next) => {
    try {
      await connectDB();
      
      // Get token from cookie (LTI session) or authorization header
      let token = null;
      
      if (req.headers?.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.substring(7);
      } else if (req.headers?.cookie) {
        const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        token = cookies['lti-session'];
      }
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.'
        });
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
      
      // Check if user exists
      const user = await LTIUser.findById(userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. User not found.'
        });
      }
      
      // Check admin permissions
      const adminPermission = await AdminPermission.getUserPermissions(userId);
      if (!adminPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin permission required.'
        });
      }
      
      // Check specific permission
      const hasPermission = await AdminPermission.hasPermission(userId, requiredPermission);
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied. ${requiredPermission} permission required.`
        });
      }
      
      // Add user and permissions to request
      req.user = user;
      req.adminPermissions = adminPermission;
      
      next();
    } catch (error) {
      console.error('Admin auth error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication.'
      });
    }
  };
}

/**
 * Verify admin access for API routes
 * @param {Request} request - Next.js request object
 * @param {string|Array} requiredPermissions - Required permission(s)
 * @returns {Promise<Object>} User and permissions info
 */
export async function verifyAdminAccess(request, requiredPermissions) {
  await connectDB();
  
  // Get token from cookie (LTI session) or header
  let token = null;
  
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});
      token = cookies['lti-session'];
    }
  }
  
  if (!token) {
    throw new Error('Access denied. No token provided.');
  }
  
  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.userId;
  
  // Check if user exists
  const user = await LTIUser.findById(userId);
  if (!user) {
    throw new Error('Invalid token. User not found.');
  }
  
  // Check admin permissions
  const adminPermission = await AdminPermission.getUserPermissions(userId);
  if (!adminPermission) {
    throw new Error('Access denied. Admin permission required.');
  }
  
  // Check specific permissions
  const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
  for (const permission of permissions) {
    const hasPermission = await AdminPermission.hasPermission(userId, permission);
    if (!hasPermission) {
      throw new Error(`Access denied. ${permission} permission required.`);
    }
  }
  
  return {
    user,
    adminPermissions: adminPermission
  };
}
