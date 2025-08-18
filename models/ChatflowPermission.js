import mongoose from 'mongoose';

const chatflowPermissionSchema = new mongoose.Schema({
  // Chatflow ID that can be accessed
  chatflowId: { 
    type: String, 
    required: true
  },
  
  // Course/Context ID from LTI
  courseId: { 
    type: String, 
    required: true
  },
  
  // Allowed roles for this chatflow in this course
  // Example: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor', 'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner']
  allowedRoles: [{ 
    type: String, 
    required: true
  }],
  
  // Description of the permission (optional)
  description: {
    type: String,
    default: ''
  },
  
  // Whether this permission is active
  isActive: { 
    type: Boolean, 
    default: true 
  },
  
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

// Compound indexes for efficient queries
chatflowPermissionSchema.index({ courseId: 1, chatflowId: 1 }, { unique: true });
chatflowPermissionSchema.index({ chatflowId: 1 });
chatflowPermissionSchema.index({ courseId: 1 });

// Update the updatedAt field before saving
chatflowPermissionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const ChatflowPermission = mongoose.models.ChatflowPermission || mongoose.model('ChatflowPermission', chatflowPermissionSchema);

export default ChatflowPermission;
