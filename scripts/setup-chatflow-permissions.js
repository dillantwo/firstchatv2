const mongoose = require('mongoose');

// 数据库连接字符串
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/firstchat';

// ChatflowPermission Schema
const chatflowPermissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'LTIUser', required: true },
  chatflowId: { type: String, required: true },
  hasAccess: { type: Boolean, default: true },
  grantedBy: { type: String, required: true },
  grantedAt: { type: Date, default: Date.now },
  revokedAt: { type: Date },
  revokedBy: { type: String },
  reason: { type: String }
}, { timestamps: true });

const ChatflowPermission = mongoose.models.ChatflowPermission || mongoose.model('ChatflowPermission', chatflowPermissionSchema);

// LTIUser Schema
const LTIUserSchema = new mongoose.Schema({
  sub: { type: String, required: true },
  iss: { type: String, required: true },
  email: { type: String, default: null },
  name: { type: String, required: true },
  given_name: { type: String },
  family_name: { type: String },
  roles: [String],
  context_id: String,
  context_title: String,
  context_label: String,
  resource_link_id: String,
  resource_link_title: String,
  tool_platform: {
    guid: String,
    name: String,
    version: String,
    product_family_code: String
  },
  session_id: String,
  last_login: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const LTIUser = mongoose.models.LTIUser || mongoose.model('LTIUser', LTIUserSchema);

async function checkAndSetupPermissions() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Check existing permissions
    const existingPermissions = await ChatflowPermission.find({});
    console.log(`Found ${existingPermissions.length} existing chatflow permissions:`);
    existingPermissions.forEach(perm => {
      console.log(`  - User: ${perm.userId}, Chatflow: ${perm.chatflowId}, Access: ${perm.hasAccess}`);
    });
    
    // Get all LTI users
    const ltiUsers = await LTIUser.find({});
    console.log(`\nFound ${ltiUsers.length} LTI users:`);
    ltiUsers.forEach(user => {
      console.log(`  - ID: ${user._id}, Name: ${user.name}, Sub: ${user.sub}`);
    });
    
    // List of allowed chatflow IDs (from ChatflowSelector.jsx)
    const allowedChatflowIds = [
      '4246f046-843f-473a-83bc-e196b73214cd', // Chinese
      'b1ce49fc-53bb-49b1-aec4-4fa5d788d750', // English  
      'bed35024-cc23-4d4e-b0c5-800cf4eab1e9', // Water
      '768fcedf-5976-4953-b9bf-09b907364236', // Math
      '57f929ff-c54b-4542-9dd0-a6eb45811ab0', // Science
    ];
    
    console.log(`\nAllowed chatflow IDs: ${allowedChatflowIds.length}`);
    allowedChatflowIds.forEach(id => console.log(`  - ${id}`));
    
    // Create permissions for all LTI users for all allowed chatflows
    let createdCount = 0;
    for (const user of ltiUsers) {
      for (const chatflowId of allowedChatflowIds) {
        // Check if permission already exists
        const existingPerm = await ChatflowPermission.findOne({
          userId: user._id,
          chatflowId: chatflowId
        });
        
        if (!existingPerm) {
          // Create new permission
          const newPermission = new ChatflowPermission({
            userId: user._id,
            chatflowId: chatflowId,
            hasAccess: true,
            grantedBy: 'system',
            grantedAt: new Date()
          });
          
          await newPermission.save();
          console.log(`✅ Created permission for user ${user.name} (${user._id}) → chatflow ${chatflowId}`);
          createdCount++;
        } else {
          // Update existing permission to ensure access
          if (!existingPerm.hasAccess) {
            existingPerm.hasAccess = true;
            existingPerm.grantedAt = new Date();
            await existingPerm.save();
            console.log(`✅ Updated permission for user ${user.name} (${user._id}) → chatflow ${chatflowId}`);
            createdCount++;
          } else {
            console.log(`ℹ️  Permission already exists for user ${user.name} (${user._id}) → chatflow ${chatflowId}`);
          }
        }
      }
    }
    
    console.log(`\n🎉 Created/updated ${createdCount} permissions`);
    
    // Final check
    const finalPermissions = await ChatflowPermission.find({});
    console.log(`\nFinal permission count: ${finalPermissions.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

checkAndSetupPermissions();
