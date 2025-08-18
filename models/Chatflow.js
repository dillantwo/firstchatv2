import mongoose from 'mongoose';

const chatflowSchema = new mongoose.Schema({
  // Flowise chatflow ID (unique identifier from Flowise API)
  flowId: { 
    type: String, 
    required: true,
    unique: true,
    index: true 
  },
  
  // Chatflow basic information
  name: { 
    type: String, 
    required: true 
  },
  
  description: { 
    type: String, 
    default: '' 
  },
  
  category: { 
    type: String, 
    default: 'General' 
  },
  
  // Deployment status
  deployed: { 
    type: Boolean, 
    default: false 
  },
  
  // API access information
  apiConfig: {
    // API endpoint for this chatflow
    endpoint: String,
    
    // Whether API access is enabled
    isApiEnabled: Boolean,
    
    // API key if required (usually not needed for internal calls)
    apiKey: String
  },
  
  // Flowise raw data (for backup/reference)
  flowData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Usage statistics
  stats: {
    totalUses: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 },
    lastUsed: Date
  },
  
  // Sync information
  syncInfo: {
    lastSyncFromFlowise: { type: Date, default: Date.now },
    flowiseVersion: String,
    syncStatus: { 
      type: String, 
      enum: ['synced', 'error', 'outdated'], 
      default: 'synced' 
    },
    syncError: String
  },
  
  // Metadata
  isActive: { 
    type: Boolean, 
    default: true 
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving
chatflowSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
chatflowSchema.index({ deployed: 1, isActive: 1 });
chatflowSchema.index({ category: 1 });
chatflowSchema.index({ 'syncInfo.lastSyncFromFlowise': 1 });

const Chatflow = mongoose.models.Chatflow || mongoose.model('Chatflow', chatflowSchema, 'chatflows');

export default Chatflow;
