import mongoose from 'mongoose';

const LTIUserSchema = new mongoose.Schema({
  // LTI 1.3 Core Claims (Required)
  sub: { type: String, required: true }, // Subject identifier
  iss: { type: String, required: true }, // Issuer (Moodle URL)
  aud: { type: String, required: true }, // Audience (our tool)
  
  // Essential User Information
  name: { type: String, required: true }, // Display name
  username: { type: String }, // LTI username
  email: { type: String, default: null }, // May be null from LTI
  
  // User Roles (simplified)
  roles: [{ type: String }], // LTI role URIs
  isInstructor: { type: Boolean, default: false }, // Derived from roles
  isAdmin: { type: Boolean, default: false }, // Derived from roles
  
  // Platform Information
  platform_id: { type: String }, // Platform GUID
  platform_name: { type: String }, // Platform display name
  
  // Session Management
  session_id: { type: String }, // Current session
  last_login: { type: Date, default: Date.now },
  
  // Essential Services (only keep what's actually needed)
  services: {
    memberships_url: { type: String }, // For roster access
    settings_url: { type: String } // For settings access
  },
  
  // Internal Fields
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to derive role flags and update timestamp
LTIUserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Derive role flags from roles array
  if (this.roles && this.roles.length > 0) {
    const roleString = this.roles.join(',').toLowerCase();
    this.isInstructor = roleString.includes('instructor') || roleString.includes('teacher');
    this.isAdmin = roleString.includes('administrator');
  }
  
  next();
});

// Essential indexes for performance
LTIUserSchema.index({ sub: 1, iss: 1 }, { unique: true });
LTIUserSchema.index({ session_id: 1 });

const LTIUser = mongoose.models.LTIUser || mongoose.model('LTIUser', LTIUserSchema, 'lti_users');

export default LTIUser;
