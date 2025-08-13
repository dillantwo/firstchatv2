import mongoose from 'mongoose';
import LTIUser from '../models/LTIUser.js';

async function migrateUsernames() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/firstchat';
    console.log(`Using MongoDB URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');

    // Find all LTI users without username
    const usersWithoutUsername = await LTIUser.find({
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: '' }
      ]
    });

    console.log(`\nFound ${usersWithoutUsername.length} users without username`);

    if (usersWithoutUsername.length === 0) {
      console.log('All users already have usernames');
      await mongoose.disconnect();
      return;
    }

    console.log('\nMigrating usernames...');
    let updated = 0;

    for (const user of usersWithoutUsername) {
      // Set username to name if available, otherwise use a fallback
      const username = user.name || user.email?.split('@')[0] || `user_${user.sub}`;
      
      await LTIUser.findByIdAndUpdate(user._id, {
        username: username
      });

      console.log(`Updated user ${user._id}: ${user.name} -> username: ${username}`);
      updated++;
    }

    console.log(`\n✅ Migration completed: ${updated} users updated`);

    // Verify the migration
    const remainingUsers = await LTIUser.find({
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: '' }
      ]
    });

    console.log(`\n📊 Verification: ${remainingUsers.length} users still without username`);

    if (remainingUsers.length === 0) {
      console.log('✅ All users now have usernames');
    } else {
      console.log('❌ Some users still need username migration');
      remainingUsers.forEach(user => {
        console.log(`  - ${user._id}: ${user.name} (${user.email})`);
      });
    }

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the migration
migrateUsernames().catch(console.error);
