const mongoose = require('mongoose');

let isConnected = false;
let connectionPromise = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

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

  // Increment connection attempts
  connectionAttempts++;
  
  if (connectionAttempts > MAX_CONNECTION_ATTEMPTS) {
    console.warn('Max connection attempts reached, database features will be disabled');
    return null;
  }

  console.log(`Attempting to connect to MongoDB (attempt ${connectionAttempts}/${MAX_CONNECTION_ATTEMPTS})`);

  // Create connection promise with improved settings
  connectionPromise = mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000, // Increased timeout
    socketTimeoutMS: 45000, // Increased socket timeout
    connectTimeoutMS: 15000, // Connection timeout
    maxPoolSize: 5, // Reduced pool size for serverless
    minPoolSize: 0, // Allow pool to scale down to 0
    maxIdleTimeMS: 30000,
    bufferCommands: false,
    bufferMaxEntries: 0,
    retryWrites: true,
    retryReads: true,
    heartbeatFrequencyMS: 10000, // Ping every 10 seconds
  });

  try {
    await connectionPromise;
    isConnected = true;
    connectionAttempts = 0; // Reset on successful connection
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

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
    });

    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    isConnected = false;
    connectionPromise = null;
    
    // In production, don't throw errors - just disable database features
    if (process.env.NODE_ENV === 'production') {
      console.warn('MongoDB connection failed, database features will be disabled');
      return null;
    }
    
    // In development, only throw after max attempts
    if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
      console.error('Max connection attempts reached, giving up');
      return null;
    }
    
    throw error;
  }
};

// Enhanced safe database operation wrapper
const safeDbOperation = async (operation, fallbackValue = null) => {
  try {
    const connection = await connectToDatabase();
    
    if (!connection || !isConnected) {
      console.warn('Database not connected, returning fallback value');
      return fallbackValue;
    }

    // Add timeout to the operation with longer timeout for production
    const timeoutMs = process.env.NODE_ENV === 'production' ? 15000 : 8000;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database operation timeout')), timeoutMs)
    );

    const result = await Promise.race([operation(), timeoutPromise]);
    return result;
  } catch (error) {
    console.warn('Database operation failed:', error.message);
    
    // Log more details in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Database operation error details:', error);
    }
    
    return fallbackValue;
  }
};

// Force close connection (useful for cleanup)
const closeConnection = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
    isConnected = false;
    connectionPromise = null;
    connectionAttempts = 0;
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};

// Get connection status
const getConnectionStatus = () => {
  return {
    isConnected,
    readyState: mongoose.connection.readyState,
    attempts: connectionAttempts,
    host: mongoose.connection.host,
    name: mongoose.connection.name
  };
};

module.exports = {
  connectToDatabase,
  safeDbOperation,
  closeConnection,
  getConnectionStatus,
  isConnected: () => isConnected
};