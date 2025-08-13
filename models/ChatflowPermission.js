const mongoose = require('mongoose');

const chatflowPermissionSchema = new mongoose.Schema({
  // Course/Context ID from LTI
  courseId: { 
    type: String, 
    required: true,
    index: true 
  },
  
  // Chatflow ID that can be accessed
  chatflowId: { 
    type: String, 
    required: true,
    index: true 
  },
  
  // LTI roles that can access this chatflow
  allowedRoles: [{ 
    type: String, 
    required: true 
  }],
  
  // Whether this permission is active
  hasAccess: { 
    type: Boolean, 
    default: true 
  },
  
  // Optional: specific user restrictions (if needed)
  restrictedToUsers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LTIUser' 
  }],
  
  // Metadata
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Compound index for efficient queries
chatflowPermissionSchema.index({ courseId: 1, chatflowId: 1 });
chatflowPermissionSchema.index({ courseId: 1, allowedRoles: 1 });

// Update timestamp on save
chatflowPermissionSchema.pre('save', function() {
  this.updatedAt = new Date();
});

const ChatflowPermission = mongoose.models.ChatflowPermission || 
  mongoose.model('ChatflowPermission', chatflowPermissionSchema);

module.exports = { ChatflowPermission };
