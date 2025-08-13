const mongoose = require('mongoose');

// Load environment variables manually (avoid dotenv dependency)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/firstchat';

// Database connection
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

// ChatflowPermission Schema
const chatflowPermissionSchema = new mongoose.Schema({
  courseId: { type: String, required: true, index: true },
  chatflowId: { type: String, required: true, index: true },
  allowedRoles: [{ type: String, required: true }],
  hasAccess: { type: Boolean, default: true },
  restrictedToUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LTIUser' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

chatflowPermissionSchema.index({ courseId: 1, chatflowId: 1 });
chatflowPermissionSchema.index({ courseId: 1, allowedRoles: 1 });

const ChatflowPermission = mongoose.models.ChatflowPermission || 
  mongoose.model('ChatflowPermission', chatflowPermissionSchema);

// LTI User Schema
const ltiUserSchema = new mongoose.Schema({
  sub: { type: String, required: true },
  iss: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  context_id: { type: String, required: true },
  context_title: { type: String },
  roles: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const LTIUser = mongoose.models.LTIUser || mongoose.model('LTIUser', ltiUserSchema, 'ltiusers');

async function setupCourseBasedPermissions() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    // Get all existing permissions (old format)
    const existingPermissions = await ChatflowPermission.find({});
    console.log(`Found ${existingPermissions.length} existing permissions`);

    // Clear old permissions
    if (existingPermissions.length > 0) {
      await ChatflowPermission.deleteMany({});
      console.log('Cleared old permissions');
    }

    // Get LTI users to see what courses we have
    const ltiUsers = await LTIUser.find({});
    console.log(`Found ${ltiUsers.length} LTI users`);

    // Get unique courses
    const uniqueCourses = [...new Set(ltiUsers.map(user => user.context_id))];
    console.log(`Found courses: ${uniqueCourses.join(', ')}`);

    // Define the allowed chatflow IDs
    const allowedChatflowIds = [
      '4246f046-843f-473a-83bc-e196b73214cd', // Chinese
      'b1ce49fc-53bb-49b1-aec4-4fa5d788d750', // English
      'bed35024-cc23-4d4e-b0c5-800cf4eab1e9', // Water
      '768fcedf-5976-4953-b9bf-09b907364236', // Math
      '57f929ff-c54b-4542-9dd0-a6eb45811ab0', // Science
    ];

    // Define roles that should have access
    const allowedRoles = [
      // Administrator roles
      'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator',
      'http://purl.imsglobal.org/vocab/lis/v2/system/person#Administrator',
      // Instructor roles
      'http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor',
      'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Instructor',
      // Learner roles
      'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
      'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student',
      // Content developer
      'http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper',
      // Manager
      'http://purl.imsglobal.org/vocab/lis/v2/membership#Manager'
    ];

    let createdPermissions = 0;

    // Create permissions for each course and chatflow combination
    for (const courseId of uniqueCourses) {
      console.log(`\\nSetting up permissions for course: ${courseId}`);
      
      for (const chatflowId of allowedChatflowIds) {
        const permissionData = {
          courseId,
          chatflowId,
          allowedRoles: allowedRoles,
          hasAccess: true
        };

        // Create the permission
        const newPermission = new ChatflowPermission(permissionData);
        await newPermission.save();
        
        console.log(`✅ Created permission: Course ${courseId} → Chatflow ${chatflowId}`);
        createdPermissions++;
      }
    }

    console.log(`\\n🎉 Created ${createdPermissions} course-based permissions`);

    // Display final permission count
    const finalPermissions = await ChatflowPermission.find({});
    console.log(`Final permission count: ${finalPermissions.length}`);

    // Show summary by course
    console.log('\\nPermission Summary by Course:');
    for (const courseId of uniqueCourses) {
      const coursePermissions = await ChatflowPermission.find({ courseId });
      console.log(`  Course ${courseId}: ${coursePermissions.length} chatflow permissions`);
    }

  } catch (error) {
    console.error('Error setting up course-based permissions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the setup
setupCourseBasedPermissions();
