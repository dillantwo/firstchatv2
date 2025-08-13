import mongoose from 'mongoose';
import LTIUser from '../models/LTIUser.js';

async function analyzeLTIUserData() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/firstchat';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');

    // Get the actual LTI user document
    const ltiUser = await LTIUser.findOne({}).lean();
    
    if (ltiUser) {
      console.log('\n=== Complete LTI User Document ===');
      console.log(JSON.stringify(ltiUser, null, 2));
      
      console.log('\n=== Field Analysis ===');
      Object.entries(ltiUser).forEach(([key, value]) => {
        console.log(`${key}: ${typeof value} ${Array.isArray(value) ? `(array of ${value.length})` : ''}`);
        if (key === 'custom' && typeof value === 'object' && value !== null) {
          console.log('  Custom fields:');
          Object.entries(value).forEach(([customKey, customValue]) => {
            console.log(`    ${customKey}: ${typeof customValue} = ${customValue}`);
          });
        }
      });

      // Check for redundant data
      console.log('\n=== Potential Redundancies ===');
      const mainFields = Object.keys(ltiUser).filter(key => key !== 'custom' && key !== '_id' && key !== '__v');
      const customFields = ltiUser.custom ? Object.keys(ltiUser.custom) : [];
      
      const duplicateFields = mainFields.filter(field => customFields.includes(field));
      if (duplicateFields.length > 0) {
        console.log('Fields that exist both in main document and custom:');
        duplicateFields.forEach(field => {
          console.log(`  - ${field}: main="${ltiUser[field]}" vs custom="${ltiUser.custom[field]}"`);
        });
      }

      // Check for similar fields that might be redundant
      console.log('\n=== Similar Fields Analysis ===');
      const fieldGroups = {
        context: mainFields.filter(f => f.includes('context') || f.includes('course')),
        user: mainFields.filter(f => f.includes('name') || f.includes('user')),
        platform: mainFields.filter(f => f.includes('platform')),
        session: mainFields.filter(f => f.includes('session') || f.includes('login'))
      };

      Object.entries(fieldGroups).forEach(([group, fields]) => {
        if (fields.length > 1) {
          console.log(`${group} related fields:`);
          fields.forEach(field => {
            console.log(`  - ${field}: ${ltiUser[field]}`);
          });
        }
      });

    } else {
      console.log('No LTI user found in database');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

analyzeLTIUserData();
