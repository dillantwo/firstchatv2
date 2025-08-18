import jwt from 'jsonwebtoken';
import connectDB from '../../../../config/db.js';
import AdminPermission from '../../../../models/AdminPermission.js';
import LTIUser from '../../../../models/LTIUser.js';

// Helper function to verify admin access
async function verifyAdminAccess(request, requiredPermissions) {
  await connectDB();
  
  // Get token from cookie (LTI session) or header (manual testing)
  let token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  // If no token in header, try to get from lti_session cookie
  if (!token) {
    token = request.cookies.get('lti_session')?.value;
  }
  
  if (!token) {
    throw new Error('No session token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  
  // Handle both old token format (sub/iss) and new format (userId)
  let ltiUser;
  if (decoded.userId) {
    // New token format
    ltiUser = await LTIUser.findById(decoded.userId);
  } else if (decoded.sub && decoded.iss) {
    // Old token format (for backward compatibility)
    ltiUser = await LTIUser.findOne({ sub: decoded.sub, iss: decoded.iss });
  } else {
    throw new Error('Invalid token format');
  }

  if (!ltiUser || !ltiUser.isActive) {
    throw new Error('User not found or inactive');
  }

  const adminPermissions = await AdminPermission.findOne({ 
    userId: ltiUser._id.toString(),
    isActive: true 
  });

  if (!adminPermissions) {
    throw new Error('No admin permissions');
  }

  // Check if user has required permissions
  const permissions = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];

  const hasPermission = permissions.some(permission => 
    adminPermissions.permissions[permission] === true
  );

  if (!hasPermission) {
    throw new Error('Insufficient permissions');
  }

  return { ltiUser, adminPermissions };
}

// GET - Get all admin permissions
export async function GET(request) {
  try {
    const { ltiUser, adminPermissions } = await verifyAdminAccess(request, ['user_view', 'permission_view']);

    const permissions = await AdminPermission.find({ isActive: true })
      .sort({ updatedAt: -1 });

    return Response.json({
      success: true,
      permissions
    });

  } catch (error) {
    console.error('Error fetching admin permissions:', error);
    
    if (error.message.includes('token') || error.message.includes('User not found')) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (error.message.includes('permissions')) {
      return Response.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new admin permission
export async function POST(request) {
  try {
    const { ltiUser, adminPermissions } = await verifyAdminAccess(request, 'user_create');
    const body = await request.json();
    const { userId, userEmail, userName, role, restrictedToCourses } = body;

    // Check if user exists
    const targetUser = await LTIUser.findById(userId);
    if (!targetUser) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if permission already exists
    const existingPermission = await AdminPermission.findOne({ userId, isActive: true });
    if (existingPermission) {
      return Response.json(
        { error: 'Admin permission already exists for this user' },
        { status: 400 }
      );
    }

    const newAdminPermission = new AdminPermission({
      userId,
      userEmail: userEmail || targetUser.email,
      userName: userName || targetUser.name,
      role,
      restrictedToCourses: restrictedToCourses || [],
      createdBy: ltiUser._id.toString()
    });

    await newAdminPermission.save();

    return Response.json({
      success: true,
      permission: newAdminPermission
    });

  } catch (error) {
    console.error('Error creating admin permission:', error);
    
    if (error.message.includes('token') || error.message.includes('User not found')) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (error.message.includes('permissions')) {
      return Response.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
