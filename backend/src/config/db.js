const mongoose = require('mongoose');
const env = require('./env');

/**
 * Connect to MongoDB Atlas
 * Uses environment variable MONGODB_URI.
 * In development, if Atlas is not yet configured, continues gracefully in mock mode
 * so the API and health check can be tested immediately.
 */
let isDbConnected = false;

const connectDB = async () => {
  const uri = env.MONGODB_URI;
  const isPlaceholder = !uri || uri.includes('placeholder') || uri.includes('<username>');

  if (isPlaceholder) {
    console.log('ℹ️ [Database] No active MongoDB Atlas connection string in .env.');
    console.log('💡 Tip: Set MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/phishguard" in backend/.env to persist data to Atlas.');
    console.log('🚀 Running in Standalone / In-Memory Mock Mode for Scans.');
    isDbConnected = false;
    return null;
  }

  try {
    console.log('🔄 Connecting to MongoDB database...');
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      autoIndex: true
    });
    isDbConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host} [DB: ${conn.connection.name}]`);
    setupEventListeners();
    return conn;
  } catch (atlasErr) {
    console.error(`⚠️ MongoDB connection error: ${atlasErr.message}`);
    console.log('💡 Continuing server startup so URL analysis engine and health endpoints remain functional.');
    isDbConnected = false;
    setupEventListeners();
    return null;
  }
};

const setupEventListeners = () => {
  mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB connection runtime error: ${err.message}`);
    isDbConnected = false;
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected.');
    isDbConnected = false;
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB reconnected successfully.');
    isDbConnected = true;
  });
};

const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      isDbConnected = false;
      console.log('🛑 MongoDB disconnected cleanly.');
    }
  } catch (err) {
    console.error('Error during MongoDB disconnect:', err.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionStatus: () => isDbConnected || mongoose.connection.readyState === 1
};
