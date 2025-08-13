import mongoose from 'mongoose';
import LTIUser from '../models/LTIUser.js';

async function checkUsernames() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/firstchat';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');

    const allUsers = await LTIUser.find({});
    console.log(`\nTotal users: ${allUsers.length}`);

    allUsers.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  ID: ${user._id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Sub: ${user.sub}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkUsernames().catch(console.error);
