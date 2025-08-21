import mongoose from 'mongoose';

const adminPermissionSchema = new mongoose.Schema({
  // User ID (reference to LTIUser)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LTIUser',
    required: true
  },
  
  // User email for easier identification
  userEmail: {
    type: String,
    required: true
  },
  
  // User name for display
  userName: {
    type: String,
    required: true 
  },
  
  // Admin role level
  role: {
    type: String,
    enum: ['super_admin', 'course_admin', 'moderator'],
    default: 'moderator'
  },
  
  // Permissions array
  permissions: [{
    type: String,
    enum: [
      'user_view',
      'user_edit',
      'user_delete',
      'chatflow_view',
      'chatflow_edit',
      'chatflow_delete',
      'permission_view',
      'permission_edit',
      'permission_delete',
      'chat_history_view',
      'chat_history_export',
      'analytics_view',
      'system_admin'
    ]
  }],
  
  // Course restrictions (empty array means all courses)
  restrictedToCourses: [{
    courseId: String,
    courseName: String
  }],
  
  // Grant information
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LTIUser',
    required: true
  },
  
  grantedAt: {
    type: Date,
    default: Date.now
  },
  
  // Expiration date (optional)
  expiresAt: {
    type: Date,
    default: null
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Audit trail
  lastModified: {
    type: Date,
    default: Date.now
  },
  
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LTIUser'
  },
  
  // Notes
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Pre-save middleware to update lastModified
adminPermissionSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Virtual for checking if permission is expired
adminPermissionSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for checking if permission is valid
adminPermissionSchema.virtual('isValid').get(function() {
  return this.isActive && !this.isExpired;
});

// Static method to get user permissions
adminPermissionSchema.statics.getUserPermissions = function(userId) {
  return this.findOne({
    userId: userId,
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to check if user has specific permission
adminPermissionSchema.statics.hasPermission = async function(userId, permission) {
  const userPermissions = await this.getUserPermissions(userId);
  if (!userPermissions) return false;
  
  // Super admin has all permissions
  if (userPermissions.role === 'super_admin') return true;
  
  return userPermissions.permissions.includes(permission);
};

// Instance method to add permission
adminPermissionSchema.methods.addPermission = function(permission) {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
  }
  return this.save();
};

// Instance method to remove permission
adminPermissionSchema.methods.removePermission = function(permission) {
  this.permissions = this.permissions.filter(p => p !== permission);
  return this.save();
};

// Indexes for performance
adminPermissionSchema.index({ userId: 1 }, { unique: true });
adminPermissionSchema.index({ role: 1 });
adminPermissionSchema.index({ 'restrictedToCourses.courseId': 1 });
adminPermissionSchema.index({ isActive: 1 });

const AdminPermission = mongoose.models.AdminPermission || 
  mongoose.model('AdminPermission', adminPermissionSchema, 'admin_permissions');

export default AdminPermission;