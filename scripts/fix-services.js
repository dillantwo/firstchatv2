import mongoose from 'mongoose';

async function checkServices() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/firstchat';
    await mongoose.connect(mongoUri);
    
    // Check backup to see what services were in custom
    const db = mongoose.connection.db;
    const backup = await db.collection('ltiusers_backup').findOne({});
    
    console.log('=== Services in backup ===');
    if (backup && backup.custom) {
      console.log('Custom memberships_url:', backup.custom.context_memberships_url);
      console.log('Custom settings_url:', backup.custom.context_setting_url);
    }
    
    // Check current user
    const current = await db.collection('ltiusers').findOne({});
    console.log('\n=== Current user services ===');
    console.log('Services field:', current.services);
    
    // Fix the current user by adding services
    if (backup && backup.custom) {
      const services = {};
      if (backup.custom.context_memberships_url) {
        services.memberships_url = backup.custom.context_memberships_url;
      }
      if (backup.custom.context_setting_url) {
        services.settings_url = backup.custom.context_setting_url;
      }
      
      console.log('\n=== Adding services ===');
      console.log('Services to add:', services);
      
      await db.collection('ltiusers').updateOne(
        { _id: current._id },
        { 
          $set: { 
            services: services,
            username: backup.custom.user_username || backup.username
          } 
        }
      );
      
      console.log('Services added successfully');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkServices();
