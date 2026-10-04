import mongoose from 'mongoose';

const connectDB = async () => {
  // Check if MONGO_URI is configured
  if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('your_mongodb_uri_here')) {
    console.warn('⚠️  MongoDB URI not configured');
    console.warn('⚠️  Running in NO-DATABASE mode (for testing only)');
    console.warn('📖 See docs/MONGODB_SETUP.md for MongoDB Atlas setup');
    console.warn('');
    return;
  }

  try {
    const options = {
      maxPoolSize: 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      autoIndex: process.env.NODE_ENV !== 'production',
    };

    mongoose.connection.on('connected', () => {
      console.log('🟢 MongoDB connection pool established');
    });

    mongoose.connection.on('error', (err) => {
      console.error('🔴 MongoDB connection pool error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('🟠 MongoDB connection disconnected');
    });

    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`⚡ Pool Size: min=${options.minPoolSize}, max=${options.maxPoolSize}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Check your MONGO_URI in server/.env');
    console.error('2. Verify your IP is whitelisted in MongoDB Atlas');
    console.error('3. Ensure database user credentials are correct');
    console.error('4. See docs/MONGODB_SETUP.md for detailed setup');
    console.error('');
    process.exit(1);
  }
};

export default connectDB;
