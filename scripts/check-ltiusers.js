import mongoose from 'mongoose';
import LTIUser from '../models/LTIUser.js';

async function checkLTIUsers() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/firstchat';
    console.log(`Using MongoDB URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`);
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');

    // Get collection stats
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const ltiUsersCollection = collections.find(col => col.name === 'ltiusers');
    
    console.log('\n=== LTI Users Collection Info ===');
    if (ltiUsersCollection) {
      console.log('✅ ltiusers collection exists');
      
      // Get document count
      const count = await db.collection('ltiusers').countDocuments();
      console.log(`📊 Collection Stats:`);
      console.log(`   - Document count: ${count}`);
      
      // Get index information
      const indexes = await db.collection('ltiusers').indexes();
      console.log(`📑 Indexes (${indexes.length}):`);
      indexes.forEach((index, i) => {
        console.log(`   ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
      });
      
    } else {
      console.log('❌ ltiusers collection does not exist');
    }

    // Get all LTI users using the model
    console.log('\n=== LTI Users Data ===');
    const ltiUsers = await LTIUser.find({}).lean();
    console.log(`Total LTI users found: ${ltiUsers.length}`);

    if (ltiUsers.length > 0) {
      console.log('\n📋 LTI Users Summary:');
      
      // Group by issuer (platform)
      const byIssuer = {};
      const byContext = {};
      const byRole = {};
      
      ltiUsers.forEach(user => {
        // Group by issuer
        if (!byIssuer[user.iss]) byIssuer[user.iss] = 0;
        byIssuer[user.iss]++;
        
        // Group by context
        if (user.context_id) {
          if (!byContext[user.context_id]) byContext[user.context_id] = 0;
          byContext[user.context_id]++;
        }
        
        // Group by roles
        if (user.roles && user.roles.length > 0) {
          user.roles.forEach(role => {
            if (!byRole[role]) byRole[role] = 0;
            byRole[role]++;
          });
        }
      });

      console.log('\n🏢 Users by Platform (Issuer):');
      Object.entries(byIssuer).forEach(([iss, count]) => {
        console.log(`   - ${iss}: ${count} users`);
      });

      console.log('\n🎓 Users by Context (Course):');
      Object.entries(byContext).forEach(([contextId, count]) => {
        const user = ltiUsers.find(u => u.context_id === contextId);
        const contextTitle = user ? user.context_title || user.context_label || 'Unknown' : 'Unknown';
        console.log(`   - ${contextId} (${contextTitle}): ${count} users`);
      });

      console.log('\n👥 Users by Role:');
      Object.entries(byRole).forEach(([role, count]) => {
        console.log(`   - ${role}: ${count} users`);
      });

      // Show recent users
      const recentUsers = ltiUsers
        .sort((a, b) => new Date(b.last_login) - new Date(a.last_login))
        .slice(0, 5);

      console.log('\n🕒 Most Recent Logins (Last 5):');
      recentUsers.forEach((user, i) => {
        const lastLogin = new Date(user.last_login).toLocaleString();
        console.log(`   ${i + 1}. ${user.name} (${user.email || 'No email'}) - ${lastLogin}`);
        console.log(`      Context: ${user.context_title || user.context_label || 'No context'}`);
        console.log(`      Roles: ${user.roles ? user.roles.join(', ') : 'No roles'}`);
      });

      // Show sample document structure
      console.log('\n📄 Sample Document Structure:');
      const sampleUser = ltiUsers[0];
      const sampleKeys = Object.keys(sampleUser);
      console.log('Fields present in documents:');
      sampleKeys.forEach(key => {
        const value = sampleUser[key];
        let type = typeof value;
        if (Array.isArray(value)) type = `array(${value.length})`;
        if (value instanceof Date) type = 'date';
        console.log(`   - ${key}: ${type}`);
      });

    } else {
      console.log('No LTI users found in the database');
    }

  } catch (error) {
    console.error('Error checking LTI users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the check
checkLTIUsers();
