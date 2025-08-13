import mongoose from 'mongoose';
import LTIUser from '../models/LTIUser.js';
import SimplifiedLTIUser from '../models/SimplifiedLTIUser.js';

async function migrateLTIUsers() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/firstchat';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');

    // Get all existing LTI users
    const existingUsers = await LTIUser.find({}).lean();
    console.log(`Found ${existingUsers.length} existing LTI users`);

    if (existingUsers.length === 0) {
      console.log('No users to migrate');
      return;
    }

    console.log('\n=== Migration Preview ===');
    
    const migratedUsers = existingUsers.map(user => {
      // Extract essential services URLs from custom field
      const services = {};
      if (user.custom) {
        if (user.custom.context_memberships_url) {
          services.memberships_url = user.custom.context_memberships_url;
        }
        if (user.custom.context_setting_url) {
          services.settings_url = user.custom.context_setting_url;
        }
      }

      const simplified = {
        sub: user.sub,
        iss: user.iss,
        aud: user.aud,
        name: user.name,
        username: user.username || (user.custom ? user.custom.user_username : null),
        email: user.email,
        context_id: user.context_id,
        context_title: user.context_title || user.context_label,
        resource_link_id: user.resource_link_id,
        resource_link_title: user.resource_link_title,
        roles: user.roles || [],
        platform_id: user.platform_id,
        platform_name: user.platform_name,
        session_id: user.session_id,
        last_login: user.last_login,
        services: services,
        isActive: user.isActive !== undefined ? user.isActive : true,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      return simplified;
    });

    // Show what will be migrated
    console.log('Sample migrated user:');
    console.log(JSON.stringify(migratedUsers[0], null, 2));

    // Calculate space savings
    const originalSize = JSON.stringify(existingUsers).length;
    const simplifiedSize = JSON.stringify(migratedUsers).length;
    const savings = ((originalSize - simplifiedSize) / originalSize * 100).toFixed(1);
    
    console.log(`\n=== Storage Analysis ===`);
    console.log(`Original data size: ${originalSize} characters`);
    console.log(`Simplified data size: ${simplifiedSize} characters`);
    console.log(`Space savings: ${savings}%`);

    console.log('\n=== Fields Removed ===');
    const originalFields = new Set();
    const simplifiedFields = new Set(Object.keys(migratedUsers[0]));
    
    existingUsers.forEach(user => {
      Object.keys(user).forEach(key => originalFields.add(key));
      if (user.custom) {
        Object.keys(user.custom).forEach(key => originalFields.add(`custom.${key}`));
      }
    });

    const removedFields = Array.from(originalFields).filter(field => 
      !simplifiedFields.has(field) && 
      field !== '_id' && 
      field !== '__v' &&
      !field.startsWith('custom.')
    );

    console.log('Removed redundant fields:');
    removedFields.forEach(field => console.log(`  - ${field}`));

    const customFieldsKept = ['memberships_url', 'settings_url'];
    const customFieldsRemoved = [];
    if (existingUsers[0].custom) {
      Object.keys(existingUsers[0].custom).forEach(key => {
        if (!customFieldsKept.some(kept => existingUsers[0].custom[key] === migratedUsers[0].services[kept])) {
          customFieldsRemoved.push(key);
        }
      });
    }

    console.log('\nRemoved custom fields:');
    customFieldsRemoved.forEach(field => console.log(`  - custom.${field}`));

    console.log('\nKept essential custom fields in services:');
    customFieldsKept.forEach(field => console.log(`  - ${field}`));

    // Ask for confirmation to proceed with actual migration
    console.log('\n=== Ready to Migrate ===');
    console.log('This will:');
    console.log('1. Create a backup collection (ltiusers_backup)');
    console.log('2. Clear the current ltiusers collection');
    console.log('3. Insert simplified data');
    console.log('\nTo proceed with the migration, run:');
    console.log('node scripts/migrate-ltiuser-simplified.js --confirm');

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

async function performMigration() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/firstchat';
    await mongoose.connect(mongoUri);
    
    // Create backup
    const existingUsers = await LTIUser.find({}).lean();
    const db = mongoose.connection.db;
    
    console.log('Creating backup...');
    await db.collection('ltiusers_backup').deleteMany({});
    await db.collection('ltiusers_backup').insertMany(existingUsers);
    console.log('Backup created successfully');

    // Clear existing collection
    console.log('Clearing existing ltiusers collection...');
    await LTIUser.deleteMany({});

    // Insert simplified data
    console.log('Inserting simplified data...');
    const migratedUsers = existingUsers.map(user => {
      const services = {};
      if (user.custom) {
        if (user.custom.context_memberships_url) {
          services.memberships_url = user.custom.context_memberships_url;
        }
        if (user.custom.context_setting_url) {
          services.settings_url = user.custom.context_setting_url;
        }
      }

      return {
        sub: user.sub,
        iss: user.iss,
        aud: user.aud,
        name: user.name,
        username: user.username || (user.custom ? user.custom.user_username : null),
        email: user.email,
        context_id: user.context_id,
        context_title: user.context_title || user.context_label,
        resource_link_id: user.resource_link_id,
        resource_link_title: user.resource_link_title,
        roles: user.roles || [],
        platform_id: user.platform_id,
        platform_name: user.platform_name,
        session_id: user.session_id,
        last_login: user.last_login,
        services: services,
        isActive: user.isActive !== undefined ? user.isActive : true,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    });

    // Use the original LTI User model to insert (since we're keeping the same collection name)
    await LTIUser.insertMany(migratedUsers);
    
    console.log('Migration completed successfully!');
    console.log(`Migrated ${migratedUsers.length} users`);

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Check if --confirm flag is provided
const args = process.argv.slice(2);
if (args.includes('--confirm')) {
  performMigration();
} else {
  migrateLTIUsers();
}
