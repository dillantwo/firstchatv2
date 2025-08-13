// Migration script to handle transition from Clerk to LTI authentication
// This script helps clean up old Clerk-related data and prepare for LTI

import { connectDB } from '../config/db.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import LTIUser from '../models/LTIUser.js';

async function migrateToLTI() {
  try {
    await connectDB();
    console.log('Connected to database');

    // 1. Check existing chats that might have Clerk user IDs
    const existingChats = await Chat.find({});
    console.log(`Found ${existingChats.length} existing chats`);

    // 2. Log stats about user IDs (to understand the current state)
    const userIdFormats = {};
    existingChats.forEach(chat => {
      const userIdType = chat.userId?.startsWith('user_') ? 'clerk' : 'other';
      userIdFormats[userIdType] = (userIdFormats[userIdType] || 0) + 1;
    });
    
    console.log('User ID formats found:', userIdFormats);

    // 3. Check if there are any old User documents (from Clerk)
    const oldUsers = await User.find({});
    console.log(`Found ${oldUsers.length} old user documents`);

    // 4. Initialize LTI User collection if it doesn't exist
    const ltiUserCount = await LTIUser.countDocuments();
    console.log(`Found ${ltiUserCount} LTI users`);

    // 5. Create indexes for better performance
    console.log('Creating database indexes...');
    
    // LTI User indexes
    await LTIUser.createIndexes();
    
    // Chat indexes (if not already created)
    try {
      await Chat.collection.createIndex({ userId: 1, updatedAt: -1 });
      await Chat.collection.createIndex({ chatflowId: 1 });
      console.log('Indexes created successfully');
    } catch (error) {
      if (error.code === 85) {
        console.log('Indexes already exist');
      } else {
        console.error('Error creating indexes:', error);
      }
    }

    // 6. Provide information about cleanup (don't auto-delete)
    if (userIdFormats.clerk > 0) {
      console.log(`
⚠️  ATTENTION REQUIRED:
Found ${userIdFormats.clerk} chats with Clerk user IDs.

To complete the migration:
1. These chats will become inaccessible until users log in via LTI
2. When users first log in via LTI, you may want to:
   - Create a data mapping if you want to preserve their old chats
   - Or let them start fresh with new chats

For now, these chats remain in the database but won't be accessible.
      `);
    }

    if (oldUsers.length > 0) {
      console.log(`
📝 Found ${oldUsers.length} old user documents from Clerk.
These are no longer used and can be safely removed after confirming LTI is working properly.
      `);
    }

    console.log(`
✅ Migration preparation completed!

Next steps:
1. Configure your LTI 1.3 environment variables (see .env.lti.example)
2. Set up the LTI tool in your Moodle instance
3. Test the LTI integration
4. Optionally clean up old Clerk data once LTI is confirmed working

The application is now ready for LTI 1.3 authentication.
    `);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateToLTI()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
