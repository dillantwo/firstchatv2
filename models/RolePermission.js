import mongoose from 'mongoose';

const rolePermissionSchema = new mongoose.Schema({
  // Course ID
  courseId: {
    type: String,
    required: true
  },
  
  // Course name for reference
  courseName: {
    type: String,
    required: true
  },
  
  // Role name (e.g., "Instructor", "Student", etc.)
  roleName: {
    type: String,
    required: true
  },
  
  // Chatflow ID
  chatflowId: {
    type: String,
    required: true
  },
  
  // Chatflow name for reference
  chatflowName: {
    type: String,
    required: true
  },
  
  // Permissions array
  permissions: [{
    type: String,
    enum: ['view', 'chat', 'edit', 'admin'],
    default: 'view'
  }],
  
  // Whether this permission should be auto-granted to new users with this role
  autoGrant: {
    type: Boolean,
    default: false
  },
  
  // Priority for role-based permissions (higher number = higher priority)
  priority: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LTIUser',
    required: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LTIUser'
  },
  
  // Description/notes
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
rolePermissionSchema.index({ courseId: 1, roleName: 1, chatflowId: 1 }, { unique: true });
rolePermissionSchema.index({ courseId: 1, roleName: 1 });
rolePermissionSchema.index({ chatflowId: 1 });
rolePermissionSchema.index({ isActive: 1 });
rolePermissionSchema.index({ autoGrant: 1 });

// Static method to get permissions for a role in a course
rolePermissionSchema.statics.getPermissionsForRole = function(courseId, roleName) {
  return this.find({
    courseId: courseId,
    roleName: roleName,
    isActive: true
  });
};

// Static method to check if role has permission for chatflow
rolePermissionSchema.statics.hasRolePermission = async function(courseId, roleName, chatflowId, permission) {
  const rolePermission = await this.findOne({
    courseId: courseId,
    roleName: roleName,
    chatflowId: chatflowId,
    isActive: true
  });
  
  if (!rolePermission) return false;
  return rolePermission.permissions.includes(permission);
};

// Instance method to add permission
rolePermissionSchema.methods.addPermission = function(permission) {
  if (!this.permissions.includes(permission)) {
    this.permissions.push(permission);
  }
  return this.save();
};

// Instance method to remove permission
rolePermissionSchema.methods.removePermission = function(permission) {
  this.permissions = this.permissions.filter(p => p !== permission);
  return this.save();
};

const RolePermission = mongoose.models.RolePermission || 
  mongoose.model('RolePermission', rolePermissionSchema, 'role_permissions');

export default RolePermission;
