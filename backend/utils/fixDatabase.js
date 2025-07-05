const mongoose = require('mongoose');
const logger = require('./logger');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('Connected to MongoDB for migration');
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { error: error.message });
    process.exit(1);
  }
};

// Fix database schema issues
const fixDatabaseSchema = async () => {
  try {
    const db = mongoose.connection.db;
    
    // Get the users collection
    const usersCollection = db.collection('users');
    
    // Check if there are any documents with email field
    const usersWithEmail = await usersCollection.find({ email: { $exists: true } }).toArray();
    
    if (usersWithEmail.length > 0) {
      logger.warn(`Found ${usersWithEmail.length} users with email field, removing email field`);
      
      // Remove email field from all documents
      await usersCollection.updateMany(
        { email: { $exists: true } },
        { $unset: { email: "" } }
      );
      
      logger.info('Successfully removed email field from all users');
    } else {
      logger.info('No users with email field found');
    }
    
    // Check for users with null or empty username
    const usersWithNullUsername = await usersCollection.find({
      $or: [
        { username: null },
        { username: "" },
        { username: { $exists: false } }
      ]
    }).toArray();
    
    if (usersWithNullUsername.length > 0) {
      logger.warn(`Found ${usersWithNullUsername.length} users with null/empty username, removing them`);
      
      // Remove users with null/empty username
      await usersCollection.deleteMany({
        $or: [
          { username: null },
          { username: "" },
          { username: { $exists: false } }
        ]
      });
      
      logger.info('Successfully removed users with null/empty username');
    }
    
    // Drop any existing indexes that might cause issues
    try {
      await usersCollection.dropIndex('email_1');
      logger.info('Dropped email index');
    } catch (error) {
      if (error.code !== 27) { // Index not found
        logger.warn('Could not drop email index', { error: error.message });
      }
    }
    
    // Ensure username index exists
    try {
      await usersCollection.createIndex({ username: 1 }, { unique: true });
      logger.info('Created username unique index');
    } catch (error) {
      logger.warn('Could not create username index', { error: error.message });
    }
    
    logger.info('Database schema fix completed successfully');
    
  } catch (error) {
    logger.error('Failed to fix database schema', { error: error.message });
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    await fixDatabaseSchema();
    logger.info('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database migration failed', { error: error.message });
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fixDatabaseSchema }; 