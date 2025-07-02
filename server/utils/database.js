const mongoose = require('mongoose');

let isConnected = false;
let connectionPromise = null;

const connectToDatabase = async () => {
  // If already connected, return immediately
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If connection is in progress, wait for it
  if (connectionPromise) {
    return connectionPromise;
  }

  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.warn('MONGODB_URI not provided, database features will be disabled');
    return null;
  }

  // Create connection promise
  connectionPromise = mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 30000,
    bufferCommands: false,
    bufferMaxEntries: 0,
  });

  try {
    await connectionPromise;
    isConnected = true;
    console.log('MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
      connectionPromise = null;
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
      connectionPromise = null;
    });

    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    isConnected = false;
    connectionPromise = null;
    
    if (process.env.NODE_ENV === 'production') {
      console.warn('MongoDB connection failed, some features may not work');
      return null;
    }
    throw error;
  }
};

// Safe database operation wrapper
const safeDbOperation = async (operation, fallbackValue = null) => {
  try {
    await connectToDatabase();
    
    if (!isConnected) {
      console.warn('Database not connected, skipping operation');
      return fallbackValue;
    }

    // Add timeout to the operation
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database operation timeout')), 8000)
    );

    return await Promise.race([operation(), timeoutPromise]);
  } catch (error) {
    console.warn('Database operation failed:', error.message);
    return fallbackValue;
  }
};

module.exports = {
  connectToDatabase,
  safeDbOperation,
  isConnected: () => isConnected
};