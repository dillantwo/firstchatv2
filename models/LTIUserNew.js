import mongoose from 'mongoose';

const LTIUserSchema = new mongoose.Schema({
  // LTI 1.3 Core Claims (Required)
  sub: { type: String, required: true }, // Subject identifier - unique user ID
  iss: { type: String, required: true }, // Issuer (Moodle URL) - issuer
  aud: { type: String, required: true }, // Audience (our tool) - target application
  
  // Essential User Information
  name: { type: String, required: true }, // Display name - display name
  username: { type: String }, // LTI username - username
  email: { type: String, default: null }, // May be null from LTI - email
  
  // Platform Information (user's platform info)
  platform_id: { type: String }, // Platform GUID - platform GUID
  platform_name: { type: String }, // Platform display name - platform name
  
  // Temporary compatibility field (temporary compatibility field)
  context_id: { type: String }, // Temporary field to avoid validation errors - temporary field to avoid validation errors
  
  // Session Management (session management)
  session_id: { type: String }, // Current session - current session ID
  last_login: { type: Date, default: Date.now }, // last login time
  
  // Internal Fields (internal fields)
  isActive: { type: Boolean, default: true }, // whether active
  createdAt: { type: Date, default: Date.now }, // creation time
  updatedAt: { type: Date, default: Date.now } // update time
});

// Pre-save middleware to update timestamp
LTIUserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Essential indexes for performance
LTIUserSchema.index({ sub: 1, iss: 1 }, { unique: true }); // unique user index
LTIUserSchema.index({ session_id: 1 }); // session index
LTIUserSchema.index({ email: 1 }); // email index

const LTIUserNew = mongoose.models.LTIUserNew || mongoose.model('LTIUserNew', LTIUserSchema, 'lti_users_new');

export default LTIUserNew;
