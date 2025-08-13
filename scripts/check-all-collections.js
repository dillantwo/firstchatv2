import mongoose from 'mongoose';

async function checkAllCollections() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/firstchat';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('\n=== All Collections in Database ===');
    console.log(`Database: ${db.databaseName}`);
    console.log(`Total collections: ${collections.length}\n`);

    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments();
      
      console.log(`📁 ${collectionName}`);
      console.log(`   Documents: ${count}`);
      
      if (count > 0) {
        // Get a sample document to see the structure
        const sample = await db.collection(collectionName).findOne();
        const fields = Object.keys(sample);
        console.log(`   Sample fields: ${fields.slice(0, 5).join(', ')}${fields.length > 5 ? '...' : ''}`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

checkAllCollections();
