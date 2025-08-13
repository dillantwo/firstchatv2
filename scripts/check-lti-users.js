const mongoose = require('mongoose');

// 数据库连接字符串
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/firstchat';

// LTIUser 模型定义
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

async function checkUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\n=== Checking LTI Users ===');
    const users = await LTIUser.find({});
    console.log(`Found ${users.length} LTI users in database:`);
    
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Sub: ${user.sub}`);
      console.log(`  ISS: ${user.iss}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Roles: ${user.roles?.join(', ')}`);
      console.log(`  Context: ${user.context_title} (${user.context_id})`);
      console.log(`  Last Login: ${user.last_login}`);
      console.log(`  Active: ${user.isActive}`);
      console.log(`  Created: ${user.createdAt}`);
    });

  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkUsers();
